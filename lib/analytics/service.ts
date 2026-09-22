import "server-only";
import { EventMemberRole, WishStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { calculateResponseRate } from "@/lib/rsvp/service";
import { guestTokenSchema } from "@/lib/invitations/token";
import { EventNotFoundError } from "@/lib/analytics/errors";
import { checkAnalyticsTrackingRateLimit } from "@/lib/analytics/rate-limit";
import { trackInvitationViewSchema } from "@/lib/analytics/validation";
import type { AnalyticsDashboardData } from "@/lib/analytics/types";
import { classifyDeviceType, normalizeReferrer, type DeviceType } from "@/lib/analytics/session";

/**
 * The same eventId+sessionId within this window counts as a single
 * tracked view — refreshing/re-opening the invitation repeatedly does
 * not multiply the view count. This is an approximate, best-effort
 * dedup (a plain "does a recent row already exist" check, not a unique
 * constraint), which is deliberate: two requests racing within the same
 * few milliseconds could in rare cases both pass the check and each
 * insert a row. That's an accepted, documented limitation for an
 * analytics counter (see docs/DECISIONS.md's Phase 15 entry) — it is not
 * the kind of correctness guarantee `CheckIn`'s unique constraint
 * provides for check-in state, and "total views" was never claimed to be
 * an exact count of distinct human visits.
 */
const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000;

/**
 * Resolves a guest id strictly from a token, cross-checked against the
 * caller's own `eventId` — same shape as every other domain's private
 * `resolveGuestForX()` (see `lib/wishes/service.ts`, `lib/rsvp/service.ts`,
 * `lib/checkin/service.ts`). Deliberately separate from
 * `lib/invitations/token.ts`'s `resolveGuestContext()`, which returns
 * only a display name for public rendering — that function's return
 * shape is passed to a client component and must never carry a database
 * id. This one is analytics-only, never leaves the server, and is never
 * included in any value returned to a page/component.
 */
async function resolveGuestIdForAnalyticsTracking(
  eventId: string,
  rawToken: unknown,
): Promise<string | null> {
  const parsed = guestTokenSchema.safeParse(rawToken);
  if (!parsed.success) return null;

  const invitation = await prisma.guestInvitation.findUnique({
    where: { token: parsed.data },
    select: { guest: { select: { id: true, eventId: true } } },
  });

  if (!invitation?.guest) return null;
  if (invitation.guest.eventId !== eventId) return null;

  return invitation.guest.id;
}

/**
 * Validates, rate-limits, deduplicates, and persists one invitation-view
 * record. Never throws to a caller expecting a business-outcome result —
 * see `trackPublicInvitationView()` below, the only caller this is meant
 * to have, for the actual failure-swallowing boundary. Kept separate so
 * this function's own logic (validation/rate-limit/dedup/write) stays
 * unit- and integration-testable on its own terms.
 */
async function recordInvitationView(input: {
  eventId: string;
  guestId: string | null;
  sessionId: string;
  deviceType: DeviceType;
  referrer: string | null;
}): Promise<void> {
  const parsed = trackInvitationViewSchema.safeParse(input);
  if (!parsed.success) return;

  if (!checkAnalyticsTrackingRateLimit(parsed.data.sessionId)) return;

  const recent = await prisma.invitationView.findFirst({
    where: {
      eventId: parsed.data.eventId,
      sessionId: parsed.data.sessionId,
      createdAt: { gte: new Date(Date.now() - VIEW_DEDUP_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (recent) return;

  await prisma.invitationView.create({
    data: {
      eventId: parsed.data.eventId,
      guestId: parsed.data.guestId,
      sessionId: parsed.data.sessionId,
      deviceType: parsed.data.deviceType,
      referrer: parsed.data.referrer,
    },
  });
}

/**
 * The only entry point the public `/invite/[slug]` route should call.
 * Never throws — a database outage, a malformed cookie, or any other
 * failure here must never prevent the invitation itself from rendering
 * (see docs/STATUS.md's Phase 15 entry). `sessionId` is `null` when the
 * analytics cookie wasn't set (e.g. blocked by the browser) — tracking is
 * silently skipped in that case, since there is nothing to key a view on.
 */
export async function trackPublicInvitationView(params: {
  eventId: string;
  guestToken: string | null;
  hasPersonalizationContext: boolean;
  sessionId: string | null | undefined;
  userAgent: string | null;
  referrer: string | null;
}): Promise<void> {
  if (!params.sessionId) return;

  try {
    const guestId = params.hasPersonalizationContext
      ? await resolveGuestIdForAnalyticsTracking(params.eventId, params.guestToken)
      : null;

    await recordInvitationView({
      eventId: params.eventId,
      guestId,
      sessionId: params.sessionId,
      deviceType: classifyDeviceType(params.userAgent),
      referrer: normalizeReferrer(params.referrer),
    });
  } catch (error) {
    console.error("[analytics] Failed to track invitation view", error);
  }
}

/**
 * 0-100, rounded, clamped. `confirmed` (RSVP ATTENDING count) is the
 * denominator per this phase's product definition of "check-in
 * progress" — distinct from Phase 14's own reception-dashboard
 * "remaining" (which is `totalInvited - checkedIn`, a different,
 * operational metric). `Math.min(checkedIn, confirmed)` guards against
 * checkedIn exceeding confirmed, which is an expected, real scenario
 * here (a walk-in guest can check in without ever RSVPing ATTENDING —
 * D-047), not a data bug.
 */
export function calculateCheckInProgress(checkedIn: number, confirmed: number): number {
  if (confirmed <= 0) return 0;
  return Math.round((Math.min(checkedIn, confirmed) / confirmed) * 100);
}

/**
 * VIEWER-and-above read access, matching every other read-only dashboard
 * in this codebase (RSVP, wishes list, check-in dashboard). Purely
 * aggregates already-authoritative data — never mutates anything, never
 * infers a view from RSVP/GuestInvitation.status/check-in, and never
 * fabricates a gift transaction/revenue figure that doesn't exist.
 */
export async function getAnalyticsDashboardData(
  eventId: string,
  userId: string,
): Promise<AnalyticsDashboardData> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();

  const role: EventMemberRole =
    event.ownerId === userId
      ? EventMemberRole.OWNER
      : (event.members[0]?.role ?? EventMemberRole.VIEWER);

  const [
    totalViews,
    uniqueSessionGroups,
    personalizedOpens,
    totalGuests,
    attendanceGroups,
    totalWishes,
    approvedWishes,
    activeGiftMethods,
    checkedIn,
  ] = await Promise.all([
    prisma.invitationView.count({ where: { eventId } }),
    prisma.invitationView.groupBy({ by: ["sessionId"], where: { eventId } }),
    prisma.invitationView.count({ where: { eventId, guestId: { not: null } } }),
    prisma.guest.count({ where: { eventId } }),
    prisma.rSVP.groupBy({ by: ["attendance"], where: { eventId }, _count: { _all: true } }),
    prisma.wish.count({ where: { eventId, status: { not: WishStatus.DELETED } } }),
    prisma.wish.count({ where: { eventId, status: WishStatus.APPROVED } }),
    prisma.giftMethod.count({ where: { eventId, isActive: true } }),
    prisma.checkIn.count({ where: { eventId } }),
  ]);

  const attending = attendanceGroups.find((g) => g.attendance === "ATTENDING");
  const notAttending = attendanceGroups.find((g) => g.attendance === "NOT_ATTENDING");
  const maybe = attendanceGroups.find((g) => g.attendance === "MAYBE");
  const totalResponded = attendanceGroups.reduce((sum, g) => sum + g._count._all, 0);
  const confirmed = attending?._count._all ?? 0;

  return {
    event: { id: event.id, title: event.title, slug: event.slug },
    role,
    invitation: {
      totalViews,
      uniqueVisitors: uniqueSessionGroups.length,
      personalizedOpens,
    },
    rsvp: {
      totalGuests,
      confirmed,
      declined: notAttending?._count._all ?? 0,
      maybe: maybe?._count._all ?? 0,
      unanswered: Math.max(0, totalGuests - totalResponded),
      responseRate: calculateResponseRate(totalResponded, totalGuests),
    },
    wishes: {
      total: totalWishes,
      approved: approvedWishes,
    },
    gifts: {
      activeMethods: activeGiftMethods,
    },
    checkIn: {
      checkedIn,
      remainingConfirmed: Math.max(0, confirmed - checkedIn),
      progressRate: calculateCheckInProgress(checkedIn, confirmed),
    },
  };
}
