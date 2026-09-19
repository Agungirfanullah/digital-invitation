import type {
  EventMemberRole,
  GuestCategory,
  GuestInvitationStatus,
  RSVPAttendance,
} from "@prisma/client";

/**
 * A guest's own RSVP answer. Never includes `guestId` — every caller that
 * has this already resolved the guest server-side from a valid token
 * (public flow) or an authorized event (dashboard flow); nothing here is
 * meant to be used to re-target a mutation.
 */
export interface RsvpAnswer {
  attendance: RSVPAttendance;
  attendeeCount: number;
  message: string | null;
}

/**
 * The authenticated, event-scoped view of one guest's RSVP — adds
 * `submittedAt`, which the public-facing `RsvpAnswer` doesn't need (the
 * guest already knows when they answered; the dashboard needs to show it
 * to the event owner).
 */
export interface RsvpDetail extends RsvpAnswer {
  submittedAt: Date | null;
}

/**
 * What the public RSVP section needs to render for one personalized
 * guest. Deliberately separate from `PublicInvitation`
 * (lib/invitations/types.ts) — see docs/DECISIONS.md D-025.
 */
export interface RsvpGuestView {
  guestName: string;
  seatQuota: number;
  existing: RsvpAnswer | null;
}

export interface RsvpOverviewCounts {
  totalGuests: number;
  totalResponded: number;
  totalPending: number;
  attending: number;
  notAttending: number;
  maybe: number;
  totalSeatsInvited: number;
  confirmedSeats: number;
  /** 0-100, rounded. `0` when there are no guests yet (never divides by zero). */
  responseRate: number;
}

export interface RsvpGuestRow {
  guestId: string;
  name: string;
  category: GuestCategory;
  seatQuota: number;
  attendance: RSVPAttendance | null;
  attendeeCount: number;
  message: string | null;
  submittedAt: Date | null;
  invitationStatus: GuestInvitationStatus;
}

export interface RsvpDashboardData {
  event: { id: string; title: string; slug: string };
  role: EventMemberRole;
  /** Always computed from the full, unfiltered guest/RSVP set for the event — never skewed by the current search/filter applied to `guests` below. */
  counts: RsvpOverviewCounts;
  /** The current page of the (possibly search/filter/sort-narrowed) guest list. */
  guests: RsvpGuestRow[];
  /** Total matching the current filters — drives pagination, distinct from `counts.totalGuests`. */
  total: number;
  page: number;
  pageSize: number;
}

export type RsvpFormState =
  | { status: "idle" }
  | { status: "success"; data: RsvpAnswer }
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> };
