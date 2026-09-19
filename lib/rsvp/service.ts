import "server-only";
import { EventMemberRole, GuestInvitationStatus, type RSVPAttendance } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import {
  EventNotFoundError,
  InvalidRsvpTokenError,
  SeatQuotaExceededError,
} from "@/lib/rsvp/errors";
import { rsvpTokenSchema } from "@/lib/rsvp/validation";
import type { RsvpFormInput } from "@/lib/rsvp/validation";
import type {
  RsvpAnswer,
  RsvpDashboardData,
  RsvpGuestRow,
  RsvpGuestView,
  RsvpOverviewCounts,
} from "@/lib/rsvp/types";

export const RSVP_PAGE_SIZE = 25;

/**
 * A submission for anything other than ATTENDING never reserves seats —
 * "how many are coming" only makes sense when the guest is actually
 * coming (matches docs/PRD.md §21: attendee count is only asked "if
 * attending"). Whatever the client posted for a non-attending answer is
 * discarded here rather than trusted.
 */
export function resolveAttendeeCount(attendance: RSVPAttendance, submittedCount: number): number {
  return attendance === "ATTENDING" ? submittedCount : 0;
}

/**
 * RSVP submission always advances the invitation to RSVPED, regardless of
 * attendance value (RSVPED means "the guest responded," not "the guest is
 * coming" — that's `RSVP.attendance`). Never downgrades a already
 * CHECKED_IN invitation back to RSVPED, since check-in is a later stage
 * in the lifecycle (docs/DATABASE.md §9) even though nothing produces
 * CHECKED_IN yet in this phase.
 */
export function resolveNextInvitationStatus(
  currentStatus: GuestInvitationStatus,
): GuestInvitationStatus {
  return currentStatus === GuestInvitationStatus.CHECKED_IN
    ? currentStatus
    : GuestInvitationStatus.RSVPED;
}

interface RsvpGuestContext {
  invitationId: string;
  invitationStatus: GuestInvitationStatus;
  guestId: string;
  guestName: string;
  seatQuota: number;
}

/**
 * Resolves a guest strictly from a token, cross-checked against the
 * caller's own `eventId`. Never exported — every caller in this module
 * gets a guest identity this way, never from a client-supplied id. A
 * malformed token, an unknown token, and a token whose guest belongs to a
 * different event all resolve to `null` identically (see
 * `InvalidRsvpTokenError`'s doc comment).
 */
async function resolveGuestForRsvp(
  eventId: string,
  rawToken: unknown,
): Promise<RsvpGuestContext | null> {
  const parsed = rsvpTokenSchema.safeParse(rawToken);
  if (!parsed.success) return null;

  const invitation = await prisma.guestInvitation.findUnique({
    where: { token: parsed.data },
    select: {
      id: true,
      status: true,
      guest: { select: { id: true, eventId: true, name: true, seatQuota: true } },
    },
  });

  if (!invitation?.guest) return null;
  if (invitation.guest.eventId !== eventId) return null;

  return {
    invitationId: invitation.id,
    invitationStatus: invitation.status,
    guestId: invitation.guest.id,
    guestName: invitation.guest.name,
    seatQuota: invitation.guest.seatQuota,
  };
}

/**
 * What the public RSVP section needs to render for one personalized
 * guest — their name, seat quota, and any existing answer (for prefill /
 * "edit your answer" behavior). Returns `null` for anything that isn't a
 * valid, same-event, personalized guest — the caller (the invitation
 * page) treats that identically to "no token was provided at all."
 */
export async function getRsvpGuestView(
  eventId: string,
  rawToken: unknown,
): Promise<RsvpGuestView | null> {
  const context = await resolveGuestForRsvp(eventId, rawToken);
  if (!context) return null;

  const rsvp = await prisma.rSVP.findUnique({
    where: { eventId_guestId: { eventId, guestId: context.guestId } },
    select: { attendance: true, attendeeCount: true, message: true },
  });

  return {
    guestName: context.guestName,
    seatQuota: context.seatQuota,
    existing: rsvp
      ? { attendance: rsvp.attendance, attendeeCount: rsvp.attendeeCount, message: rsvp.message }
      : null,
  };
}

/**
 * Creates or updates the guest's RSVP (upsert on the `eventId+guestId`
 * unique constraint — docs/DATABASE.md §16) and advances the invitation
 * status, atomically. Throws `InvalidRsvpTokenError` for anything that
 * doesn't resolve to a real, same-event guest, and
 * `SeatQuotaExceededError` if an ATTENDING answer's attendee count
 * exceeds that specific guest's seat quota — both checked server-side,
 * never trusting the form.
 */
export async function submitRsvpForGuest(
  eventId: string,
  rawToken: unknown,
  input: RsvpFormInput,
): Promise<RsvpAnswer> {
  const context = await resolveGuestForRsvp(eventId, rawToken);
  if (!context) throw new InvalidRsvpTokenError();

  const attendeeCount = resolveAttendeeCount(input.attendance, input.attendeeCount);
  if (input.attendance === "ATTENDING" && attendeeCount > context.seatQuota) {
    throw new SeatQuotaExceededError(context.seatQuota);
  }

  const nextStatus = resolveNextInvitationStatus(context.invitationStatus);

  const [rsvp] = await prisma.$transaction([
    prisma.rSVP.upsert({
      where: { eventId_guestId: { eventId, guestId: context.guestId } },
      create: {
        eventId,
        guestId: context.guestId,
        attendance: input.attendance,
        attendeeCount,
        message: input.message,
        submittedAt: new Date(),
      },
      update: {
        attendance: input.attendance,
        attendeeCount,
        message: input.message,
        submittedAt: new Date(),
      },
      select: { attendance: true, attendeeCount: true, message: true },
    }),
    prisma.guestInvitation.update({
      where: { id: context.invitationId },
      data: { status: nextStatus },
    }),
  ]);

  return rsvp;
}

/**
 * Event-scoped RSVP overview for the dashboard — VIEWER-and-above, same
 * read boundary already established for the guest list (D-023): browsing
 * RSVP results carries the same low mutation risk as browsing the guest
 * list itself. Counts are computed from the full guest/RSVP set (not just
 * the current page), so pagination never skews the summary numbers.
 */
export async function getRsvpDashboardData(
  eventId: string,
  userId: string,
  page: number,
): Promise<RsvpDashboardData> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();

  const [totalGuests, seatAggregate, attendanceGroups, guests] = await Promise.all([
    prisma.guest.count({ where: { eventId } }),
    prisma.guest.aggregate({ where: { eventId }, _sum: { seatQuota: true } }),
    prisma.rSVP.groupBy({
      by: ["attendance"],
      where: { eventId },
      _count: { _all: true },
      _sum: { attendeeCount: true },
    }),
    prisma.guest.findMany({
      where: { eventId },
      orderBy: { name: "asc" },
      skip: (page - 1) * RSVP_PAGE_SIZE,
      take: RSVP_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        category: true,
        seatQuota: true,
        rsvps: {
          where: { eventId },
          select: { attendance: true, attendeeCount: true, message: true, submittedAt: true },
        },
      },
    }),
  ]);

  const attending = attendanceGroups.find((group) => group.attendance === "ATTENDING");
  const notAttending = attendanceGroups.find((group) => group.attendance === "NOT_ATTENDING");
  const maybe = attendanceGroups.find((group) => group.attendance === "MAYBE");
  const totalResponded = attendanceGroups.reduce((sum, group) => sum + group._count._all, 0);

  const counts: RsvpOverviewCounts = {
    totalGuests,
    totalResponded,
    totalPending: totalGuests - totalResponded,
    attending: attending?._count._all ?? 0,
    notAttending: notAttending?._count._all ?? 0,
    maybe: maybe?._count._all ?? 0,
    totalSeatsInvited: seatAggregate._sum.seatQuota ?? 0,
    confirmedSeats: attending?._sum.attendeeCount ?? 0,
  };

  const rows: RsvpGuestRow[] = guests.map((guest) => {
    const rsvp = guest.rsvps[0] ?? null;
    return {
      guestId: guest.id,
      name: guest.name,
      category: guest.category,
      seatQuota: guest.seatQuota,
      attendance: rsvp?.attendance ?? null,
      attendeeCount: rsvp?.attendeeCount ?? 0,
      message: rsvp?.message ?? null,
      submittedAt: rsvp?.submittedAt ?? null,
    };
  });

  return {
    event: { id: event.id, title: event.title, slug: event.slug },
    role:
      event.ownerId === userId
        ? EventMemberRole.OWNER
        : (event.members[0]?.role ?? EventMemberRole.VIEWER),
    counts,
    guests: rows,
    total: totalGuests,
    page,
    pageSize: RSVP_PAGE_SIZE,
  };
}
