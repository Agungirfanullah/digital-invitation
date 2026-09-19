import type { EventMemberRole, GuestCategory, RSVPAttendance } from "@prisma/client";

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
}

export interface RsvpDashboardData {
  event: { id: string; title: string; slug: string };
  role: EventMemberRole;
  counts: RsvpOverviewCounts;
  guests: RsvpGuestRow[];
  total: number;
  page: number;
  pageSize: number;
}

export type RsvpFormState =
  | { status: "idle" }
  | { status: "success"; data: RsvpAnswer }
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> };
