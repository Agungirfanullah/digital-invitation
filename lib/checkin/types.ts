import type { EventMemberRole, GuestCategory, RSVPAttendance } from "@prisma/client";

/**
 * What the reception UI is allowed to show for a resolved guest — see
 * docs/PRD.md §33: "Guest name, RSVP status, Seat quota, Check-in
 * status." Deliberately excludes phone/email/notes/invitation token —
 * none of those are asked for by the check-in flow specifically, unlike
 * the guest-management list which does show them for a different,
 * broader purpose.
 */
export interface CheckInGuestView {
  guestId: string;
  guestName: string;
  category: GuestCategory;
  seatQuota: number;
  rsvpAttendance: RSVPAttendance | null;
  isCheckedIn: boolean;
  checkedInAt: Date | null;
}

/**
 * The typed outcomes a check-in attempt (QR or manual) can resolve to.
 * `SUCCESS`/`ALREADY_CHECKED_IN` are normal business outcomes, not
 * errors — `CheckIn`'s own unique constraint is what decides between
 * them (see docs/DECISIONS.md's Phase 14 entry); everything else here is
 * what a caught domain error gets mapped to at the Server Action layer.
 */
export type CheckInOutcome =
  | { outcome: "SUCCESS"; guest: CheckInGuestView }
  | { outcome: "ALREADY_CHECKED_IN"; guest: CheckInGuestView }
  | { outcome: "INVALID_GUEST"; message: string }
  | { outcome: "UNAUTHORIZED"; message: string }
  | { outcome: "RATE_LIMITED"; message: string }
  | { outcome: "VALIDATION_ERROR"; message: string; fieldErrors?: Record<string, string[]> }
  | { outcome: "UNEXPECTED_ERROR"; message: string };

export interface CheckInSearchResultItem {
  guestId: string;
  guestName: string;
  category: GuestCategory;
  isCheckedIn: boolean;
}

export interface CheckInSummary {
  totalInvited: number;
  confirmed: number;
  checkedIn: number;
  /** `totalInvited - checkedIn`, floored at 0 — guests not yet checked in, regardless of RSVP answer (check-in is never gated on RSVP — see docs/DECISIONS.md). */
  remaining: number;
}

/** The lightweight result shape for non-mutating reads (preview/search) — distinct from `CheckInOutcome`, which is reserved for the actual check-in mutation's typed business outcomes. */
export type CheckInPreviewResult =
  { ok: true; guest: CheckInGuestView } | { ok: false; error: string };

export type CheckInSearchResult =
  { ok: true; results: CheckInSearchResultItem[] } | { ok: false; error: string };

export interface CheckInDashboardData {
  event: { id: string; title: string; slug: string };
  role: EventMemberRole;
  summary: CheckInSummary;
}
