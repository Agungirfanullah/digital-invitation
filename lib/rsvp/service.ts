import "server-only";
import {
  EventMemberRole,
  GuestInvitationStatus,
  Prisma,
  type RSVPAttendance,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { GUEST_CATEGORY_LABELS } from "@/lib/guests/labels";
import { toCsv } from "@/lib/guests/csv";
import {
  EventNotFoundError,
  InvalidRsvpTokenError,
  SeatQuotaExceededError,
} from "@/lib/rsvp/errors";
import { RSVP_ATTENDANCE_LABELS } from "@/lib/rsvp/labels";
import { rsvpTokenSchema } from "@/lib/rsvp/validation";
import type { RsvpDashboardQueryInput, RsvpFormInput } from "@/lib/rsvp/validation";
import type {
  RsvpAnswer,
  RsvpDashboardData,
  RsvpDetail,
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

/**
 * The one authoritative response-rate calculation — 0-100, rounded, and
 * never divides by zero (an event with no guests yet shows 0%, not NaN).
 * Used by the dashboard summary; nothing else in this codebase computes
 * a response rate independently.
 */
export function calculateResponseRate(totalResponded: number, totalGuests: number): number {
  if (totalGuests <= 0) return 0;
  return Math.round((totalResponded / totalGuests) * 100);
}

/**
 * Defensive floor on the confirmed-seats aggregate: `attendeeCount` is
 * already validated non-negative at submission time
 * (`rsvpFormSchema`/`resolveAttendeeCount`), so a negative sum should
 * never occur in practice — this only guards the dashboard's own display
 * against ever showing a misleading negative "orang hadir" total if a
 * row were ever persisted outside that validated path (e.g. a manual DB
 * edit or a future bug), per the instruction to handle "malformed/
 * impossible persisted values defensively." Never mutates the underlying
 * data — this is a read-side display guard only.
 */
export function normalizeConfirmedSeats(rawSum: number | null): number {
  return Math.max(0, rawSum ?? 0);
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
 * VIEWER-and-above — a single guest's RSVP answer for the Phase 7
 * per-guest "Invitation" dashboard view. Event-scoped by construction:
 * the query requires both `eventId` and `guestId` to match, so a
 * `guestId` that belongs to a different event simply matches no row
 * (returns `null`) rather than ever returning that other event's data —
 * the same IDOR-safe treatment used everywhere else in this codebase.
 * Does not separately verify the guest exists (unlike
 * `lib/guests/service.ts`'s `getGuestInvitationDetail`) — callers that
 * need a 404 for a nonexistent guest already get that from resolving the
 * guest first; this function's only job is "does an RSVP exist for this
 * exact event+guest pair," and `null` is a safe answer either way.
 */
export async function getRsvpForGuest(
  eventId: string,
  userId: string,
  guestId: string,
): Promise<RsvpDetail | null> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();

  const rsvp = await prisma.rSVP.findFirst({
    where: { eventId, guestId },
    select: { attendance: true, attendeeCount: true, message: true, submittedAt: true },
  });

  return rsvp
    ? {
        attendance: rsvp.attendance,
        attendeeCount: rsvp.attendeeCount,
        message: rsvp.message,
        submittedAt: rsvp.submittedAt,
      }
    : null;
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
 * Builds the `Guest` filter for the dashboard's search/status/category
 * filters. Deliberately separate from the summary `counts` query, which
 * always scans the full, unfiltered event — see `getRsvpDashboardData()`'s
 * doc comment and `docs/DECISIONS.md` on why filtering is table-scoped
 * only, never applied to the summary numbers.
 */
function buildRsvpGuestFilter(
  eventId: string,
  query: Pick<RsvpDashboardQueryInput, "q" | "status" | "category">,
): Prisma.GuestWhereInput {
  const where: Prisma.GuestWhereInput = { eventId };

  if (query.category !== "ALL") where.category = query.category;

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { phone: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (query.status === "PENDING") {
    where.rsvps = { none: { eventId } };
  } else if (query.status !== "ALL") {
    where.rsvps = { some: { eventId, attendance: query.status } };
  }

  return where;
}

/**
 * Event-scoped RSVP overview for the dashboard — VIEWER-and-above, same
 * read boundary already established for the guest list (D-023): browsing
 * RSVP results carries the same low mutation risk as browsing the guest
 * list itself.
 *
 * `counts` is always computed from the full, unfiltered guest/RSVP set —
 * applying the current search/status/category filter to the summary
 * numbers too would make "Total Tamu: 3" appear whenever a filter is
 * active, which is confusing and redundant with the (already filtered)
 * table below it. `guests`/`total`/`page` are the filtered, paginated
 * view; `counts.totalGuests` is the true event-wide guest count. See
 * docs/DECISIONS.md.
 */
export async function getRsvpDashboardData(
  eventId: string,
  userId: string,
  query: RsvpDashboardQueryInput,
): Promise<RsvpDashboardData> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();

  const guestFilter = buildRsvpGuestFilter(eventId, query);
  const orderBy: Prisma.GuestOrderByWithRelationInput =
    query.sort === "name_desc" ? { name: "desc" } : { name: "asc" };

  const [totalGuests, seatAggregate, attendanceGroups, filteredTotal, guests] = await Promise.all([
    prisma.guest.count({ where: { eventId } }),
    prisma.guest.aggregate({ where: { eventId }, _sum: { seatQuota: true } }),
    prisma.rSVP.groupBy({
      by: ["attendance"],
      where: { eventId },
      _count: { _all: true },
      _sum: { attendeeCount: true },
    }),
    prisma.guest.count({ where: guestFilter }),
    prisma.guest.findMany({
      where: guestFilter,
      orderBy,
      skip: (query.page - 1) * RSVP_PAGE_SIZE,
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
        invitations: { select: { status: true } },
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
    confirmedSeats: normalizeConfirmedSeats(attending?._sum.attendeeCount ?? null),
    responseRate: calculateResponseRate(totalResponded, totalGuests),
  };

  const rows: RsvpGuestRow[] = guests.map((guest) => {
    const rsvp = guest.rsvps[0] ?? null;
    const invitation = guest.invitations[0];
    return {
      guestId: guest.id,
      name: guest.name,
      category: guest.category,
      seatQuota: guest.seatQuota,
      attendance: rsvp?.attendance ?? null,
      attendeeCount: rsvp?.attendeeCount ?? 0,
      message: rsvp?.message ?? null,
      submittedAt: rsvp?.submittedAt ?? null,
      invitationStatus: invitation?.status ?? GuestInvitationStatus.NOT_SENT,
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
    total: filteredTotal,
    page: query.page,
    pageSize: RSVP_PAGE_SIZE,
  };
}

const RSVP_CSV_HEADER = [
  "nama",
  "kategori",
  "status_rsvp",
  "jumlah_tamu",
  "waktu_respons",
  "catatan",
];

/**
 * VIEWER-and-above, same read boundary as the dashboard itself and as
 * `lib/guests/service.ts`'s `exportGuestsToCsv` (D-023's precedent).
 * Deliberately excludes invitation tokens — they're a personalization
 * secret, not RSVP-management data, same principle as the guest export.
 * Always exports the full, unfiltered event guest/RSVP set (matching
 * `exportGuestsToCsv`'s existing behavior) rather than honoring the
 * dashboard's current search/filter state — "export everything, filter
 * in your own spreadsheet" is the simpler, already-established contract.
 */
export async function exportRsvpToCsv(
  eventId: string,
  userId: string,
): Promise<{ filename: string; csv: string }> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();

  const guests = await prisma.guest.findMany({
    where: { eventId },
    orderBy: { name: "asc" },
    select: {
      name: true,
      category: true,
      rsvps: {
        where: { eventId },
        select: { attendance: true, attendeeCount: true, message: true, submittedAt: true },
      },
    },
  });

  const rows = guests.map((guest) => {
    const rsvp = guest.rsvps[0] ?? null;
    return [
      guest.name,
      GUEST_CATEGORY_LABELS[guest.category],
      rsvp ? RSVP_ATTENDANCE_LABELS[rsvp.attendance] : "Belum merespons",
      rsvp ? String(rsvp.attendeeCount) : "",
      rsvp?.submittedAt ? rsvp.submittedAt.toISOString() : "",
      rsvp?.message ?? "",
    ];
  });

  return { filename: `rsvp-${event.slug}.csv`, csv: toCsv([RSVP_CSV_HEADER, ...rows]) };
}
