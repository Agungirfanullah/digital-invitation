import type { EventMemberRole } from "@prisma/client";

import type { DeviceType } from "@/lib/analytics/session";

export type { DeviceType };

/**
 * The safe, aggregated DTO the dashboard renders — never a raw
 * `InvitationView`/`RSVP`/`Wish`/`GiftMethod`/`CheckIn` row. Every count
 * here is derived from an existing, already-authoritative source (see
 * docs/DECISIONS.md's Phase 15 entry): `InvitationView` for invitation
 * metrics, `RSVP` for RSVP metrics, `Wish` for wishes, `GiftMethod` for
 * gifts (methods only — never a fabricated transaction/revenue figure),
 * and `CheckIn` for attendance (never `GuestInvitationStatus`).
 */
export interface AnalyticsDashboardData {
  event: { id: string; title: string; slug: string };
  role: EventMemberRole;
  invitation: {
    totalViews: number;
    /** Distinct analytics session ids — "unique visitors/sessions," not unique humans (one person can use multiple browsers/devices). */
    uniqueVisitors: number;
    /** Views where a valid, event-scoped personalized token resolved a guest. */
    personalizedOpens: number;
  };
  rsvp: {
    totalGuests: number;
    confirmed: number;
    declined: number;
    maybe: number;
    unanswered: number;
    /** 0-100, rounded, 0 when there are no guests yet. Reuses `lib/rsvp/service.ts`'s `calculateResponseRate()`. */
    responseRate: number;
  };
  wishes: {
    /** Non-deleted wishes (matches the wishes moderation "ALL" filter convention — D-038). */
    total: number;
    approved: number;
  };
  gifts: {
    /** Active gift *methods* only — Phase 9/16 never implemented real transactions, so no amount/revenue/transaction-count metric exists to report (D-037). */
    activeMethods: number;
  };
  checkIn: {
    checkedIn: number;
    /** `max(0, confirmed - checkedIn)` — confirmed guests (RSVP ATTENDING) not yet checked in. Can be 0 even with unconfirmed guests still arriving, since check-in is never gated on RSVP (D-047). */
    remainingConfirmed: number;
    /** 0-100, rounded, clamped at 100 — a guest can check in without having RSVPed ATTENDING (D-047), so raw checkedIn/confirmed could otherwise exceed 100%. */
    progressRate: number;
  };
}
