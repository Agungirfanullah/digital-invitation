import "server-only";
import { CheckInMethod, EventMemberRole, GuestInvitationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import {
  CheckInUnauthorizedError,
  EventNotFoundError,
  InvalidCheckInGuestError,
} from "@/lib/checkin/errors";
import { extractInvitationTokenFromScannedValue } from "@/lib/checkin/token";
import type {
  CheckInDashboardData,
  CheckInGuestView,
  CheckInSearchResultItem,
} from "@/lib/checkin/types";

interface ResolvedCheckInGuest {
  guestId: string;
  invitationId: string;
  guestName: string;
  category: Prisma.GuestGetPayload<{ select: { category: true } }>["category"];
  seatQuota: number;
}

/**
 * VIEWER-and-above — the read boundary for the whole check-in dashboard
 * page, matching the guest list's/RSVP dashboard's established D-023
 * precedent: browsing check-in status carries the same low mutation risk
 * as browsing the guest list itself.
 */
async function requireCheckInViewerAccess(eventId: string, userId: string) {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();
  return event;
}

/**
 * EDITOR-and-above — the write boundary for every check-in mutation.
 * Deliberately distinguishes two failure shapes: a real, VIEWER-level
 * member of this event whose role is simply too low gets a clear
 * `CheckInUnauthorizedError` (safe — they already know this event
 * exists and that they're a member of it, so naming the boundary leaks
 * nothing new); a stranger or a nonexistent event gets the generic,
 * IDOR-safe `EventNotFoundError` every other cross-event check in this
 * codebase already uses. The extra VIEWER-level lookup only runs on the
 * (uncommon) failure path, never on the normal EDITOR/OWNER happy path.
 */
async function requireCheckInEditorAccess(eventId: string, userId: string) {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (event) return event;

  const viewerEvent = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (viewerEvent) throw new CheckInUnauthorizedError();
  throw new EventNotFoundError();
}

/**
 * Resolves a guest strictly from a scanned QR payload, cross-checked
 * against the caller's own `eventId` — never exported. A malformed
 * payload, an unknown token, and a token whose guest belongs to a
 * different event all resolve to `null` identically (IDOR-safe),
 * matching `lib/rsvp/service.ts`'s `resolveGuestForRsvp()` and
 * `lib/wishes/service.ts`'s `resolveGuestForWish()`.
 */
async function resolveGuestByScannedValue(
  eventId: string,
  scannedValue: string,
): Promise<ResolvedCheckInGuest | null> {
  const token = extractInvitationTokenFromScannedValue(scannedValue);
  if (!token) return null;

  const invitation = await prisma.guestInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      guest: { select: { id: true, eventId: true, name: true, category: true, seatQuota: true } },
    },
  });

  if (!invitation?.guest) return null;
  if (invitation.guest.eventId !== eventId) return null;

  return {
    guestId: invitation.guest.id,
    invitationId: invitation.id,
    guestName: invitation.guest.name,
    category: invitation.guest.category,
    seatQuota: invitation.guest.seatQuota,
  };
}

/**
 * Resolves a guest strictly from `{ guestId, eventId }` — the manual-
 * search path's equivalent of `resolveGuestByScannedValue()` above, same
 * IDOR-safe shape (a `guestId` belonging to a different event resolves
 * to `null`, never that other event's data).
 */
async function resolveGuestByGuestId(
  eventId: string,
  guestId: string,
): Promise<ResolvedCheckInGuest | null> {
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, eventId },
    select: {
      id: true,
      name: true,
      category: true,
      seatQuota: true,
      invitations: { select: { id: true } },
    },
  });
  if (!guest) return null;

  const invitation = guest.invitations[0];
  if (!invitation) {
    // D-024: every guest gets its GuestInvitation atomically at creation
    // — this should be unreachable. A thrown invariant error (not a typed
    // outcome) matches lib/guests/service.ts's identical defensive
    // precedent for the same "should never happen" case.
    throw new Error(`Guest ${guest.id} is missing its invitation row — data invariant violated`);
  }

  return {
    guestId: guest.id,
    invitationId: invitation.id,
    guestName: guest.name,
    category: guest.category,
    seatQuota: guest.seatQuota,
  };
}

/** Assembles the PRD §33-scoped view (name, RSVP status, seat quota, check-in status) — never phone/email/notes/token. */
async function buildGuestView(
  eventId: string,
  resolved: ResolvedCheckInGuest,
): Promise<CheckInGuestView> {
  const [rsvp, checkIn] = await Promise.all([
    prisma.rSVP.findUnique({
      where: { eventId_guestId: { eventId, guestId: resolved.guestId } },
      select: { attendance: true },
    }),
    prisma.checkIn.findUnique({
      where: { eventId_guestId: { eventId, guestId: resolved.guestId } },
      select: { checkedInAt: true },
    }),
  ]);

  return {
    guestId: resolved.guestId,
    guestName: resolved.guestName,
    category: resolved.category,
    seatQuota: resolved.seatQuota,
    rsvpAttendance: rsvp?.attendance ?? null,
    isCheckedIn: checkIn !== null,
    checkedInAt: checkIn?.checkedInAt ?? null,
  };
}

function isCheckInDuplicateError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * The one authoritative write path, shared by both the QR and manual
 * confirm actions. `CheckIn.create()` is the operation the database's
 * own `@@unique([eventId, guestId])` constraint arbitrates — this
 * function never pre-checks "does a CheckIn already exist" before
 * writing (a check-then-act sequence would itself be racy); it always
 * attempts the create and lets Postgres decide. See
 * docs/DECISIONS.md's Phase 14 entry for the full rationale.
 *
 * `CheckIn` creation and the `GuestInvitation.status = CHECKED_IN`
 * update run inside one `$transaction` array, so they succeed or fail
 * together atomically — when the create loses the uniqueness race, the
 * whole transaction (including the status update) rolls back, so a
 * losing/duplicate request can never mutate `GuestInvitation.status`.
 */
async function performCheckIn(
  eventId: string,
  checkedInBy: string,
  method: CheckInMethod,
  resolved: ResolvedCheckInGuest,
): Promise<{ status: "SUCCESS" | "ALREADY_CHECKED_IN"; guest: CheckInGuestView }> {
  try {
    await prisma.$transaction([
      prisma.checkIn.create({
        data: { eventId, guestId: resolved.guestId, checkedInBy, method },
      }),
      prisma.guestInvitation.update({
        where: { id: resolved.invitationId },
        data: { status: GuestInvitationStatus.CHECKED_IN },
      }),
    ]);
    return { status: "SUCCESS", guest: await buildGuestView(eventId, resolved) };
  } catch (error) {
    if (isCheckInDuplicateError(error)) {
      return { status: "ALREADY_CHECKED_IN", guest: await buildGuestView(eventId, resolved) };
    }
    throw error;
  }
}

/** Read-only preview for the QR path — resolves and shows the guest, writes nothing. */
export async function previewQrCheckIn(
  eventId: string,
  userId: string,
  scannedValue: string,
): Promise<CheckInGuestView> {
  await requireCheckInViewerAccess(eventId, userId);

  const resolved = await resolveGuestByScannedValue(eventId, scannedValue);
  if (!resolved) throw new InvalidCheckInGuestError();

  return buildGuestView(eventId, resolved);
}

/**
 * Confirms a QR check-in. Re-resolves the guest from the raw scanned
 * value again (never trusts a guestId the preview step returned) — the
 * strongest available interpretation of "never trust client-supplied
 * guest identity," matching `lib/rsvp/service.ts`'s `submitRsvpForGuest()`
 * re-resolving its token fresh on every call rather than accepting an
 * already-resolved id.
 */
export async function confirmQrCheckIn(
  eventId: string,
  userId: string,
  scannedValue: string,
): Promise<{ status: "SUCCESS" | "ALREADY_CHECKED_IN"; guest: CheckInGuestView }> {
  await requireCheckInEditorAccess(eventId, userId);

  const resolved = await resolveGuestByScannedValue(eventId, scannedValue);
  if (!resolved) throw new InvalidCheckInGuestError();

  return performCheckIn(eventId, userId, CheckInMethod.QR, resolved);
}

/** Read-only preview for the manual path — same shape as previewQrCheckIn, resolving by guestId instead of a scanned token. */
export async function previewManualCheckIn(
  eventId: string,
  userId: string,
  guestId: string,
): Promise<CheckInGuestView> {
  await requireCheckInViewerAccess(eventId, userId);

  const resolved = await resolveGuestByGuestId(eventId, guestId);
  if (!resolved) throw new InvalidCheckInGuestError();

  return buildGuestView(eventId, resolved);
}

/** Confirms a manual check-in — always re-verifies `{ guestId, eventId }` server-side before writing, never trusts the id alone. */
export async function confirmManualCheckIn(
  eventId: string,
  userId: string,
  guestId: string,
): Promise<{ status: "SUCCESS" | "ALREADY_CHECKED_IN"; guest: CheckInGuestView }> {
  await requireCheckInEditorAccess(eventId, userId);

  const resolved = await resolveGuestByGuestId(eventId, guestId);
  if (!resolved) throw new InvalidCheckInGuestError();

  return performCheckIn(eventId, userId, CheckInMethod.MANUAL, resolved);
}

/**
 * VIEWER-and-above. Matches name/phone/email (the same OR-filter idiom
 * `lib/guests/service.ts`'s `getGuestPageData()` already uses for guest
 * search), but — unlike that broader guest-management view — never
 * returns phone/email/notes/token in the result: check-in's own scope
 * (PRD §33) only needs name, category, and current check-in state to let
 * staff pick the right guest. Capped at 20 results — a reception search-
 * as-you-type tool has no need for full pagination the way the guest
 * management list does.
 */
export async function searchGuestsForCheckIn(
  eventId: string,
  userId: string,
  query: string,
): Promise<CheckInSearchResultItem[]> {
  await requireCheckInViewerAccess(eventId, userId);

  const guests = await prisma.guest.findMany({
    where: {
      eventId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 20,
    select: {
      id: true,
      name: true,
      category: true,
      checkIns: { where: { eventId }, select: { id: true } },
    },
  });

  return guests.map((guest) => ({
    guestId: guest.id,
    guestName: guest.name,
    category: guest.category,
    isCheckedIn: guest.checkIns.length > 0,
  }));
}

/**
 * VIEWER-and-above. `remaining` is guests not yet checked in regardless
 * of RSVP answer — check-in is never gated on RSVP status (this phase's
 * resolved product decision), so "remaining" means "still expected at
 * the door," not "still expected among those who said yes."
 */
export async function getCheckInDashboardData(
  eventId: string,
  userId: string,
): Promise<CheckInDashboardData> {
  const event = await requireCheckInViewerAccess(eventId, userId);

  const role: EventMemberRole =
    event.ownerId === userId
      ? EventMemberRole.OWNER
      : (event.members[0]?.role ?? EventMemberRole.VIEWER);

  const [totalInvited, confirmed, checkedIn] = await Promise.all([
    prisma.guest.count({ where: { eventId } }),
    prisma.rSVP.count({ where: { eventId, attendance: "ATTENDING" } }),
    prisma.checkIn.count({ where: { eventId } }),
  ]);

  return {
    event: { id: event.id, title: event.title, slug: event.slug },
    role,
    summary: {
      totalInvited,
      confirmed,
      checkedIn,
      remaining: Math.max(0, totalInvited - checkedIn),
    },
  };
}
