import type {
  EventMemberRole,
  GuestCategory,
  GuestInvitationStatus,
  RSVPAttendance,
} from "@prisma/client";

/**
 * The authenticated owner/editor/viewer's view of a guest, including the
 * fields needed to render a personalized invitation link. Distinct from
 * any public-facing type — this is never sent to `/invite/[slug]`, and the
 * public invitation projection (`lib/invitations/projection.ts`) has no
 * guest-list field at all.
 */
export interface GuestListItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  category: GuestCategory;
  seatQuota: number;
  notes: string | null;
  createdAt: Date;
  /**
   * `null` when the caller's resolved role is VIEWER — masked at the
   * service layer (`getGuestPageData()`), not merely hidden by the page's
   * rendering choice, per docs/DECISIONS.md's Phase 7 token-privacy
   * hardening. Always a real token for an EDITOR/OWNER caller.
   */
  invitationToken: string | null;
  invitationStatus: GuestInvitationStatus;
  /** `null` means no RSVP submitted yet — not a fourth attendance value, just "no row" (see `lib/rsvp/`'s "PENDING" filter concept). Phase 8: surfaced here so the guest list doesn't need a second query to show it. */
  rsvpAttendance: RSVPAttendance | null;
}

export interface GuestDetail extends GuestListItem {
  eventId: string;
}

/**
 * The per-guest "Invitation" view (status + personalized link + RSVP
 * summary lives alongside it via a separate `lib/rsvp` call). Distinct
 * from `GuestListItem`/`GuestDetail` because it also carries the caller's
 * resolved `role` (so the page can decide what to render) and an explicit
 * `invitationTokenAvailable` flag that stays `true` even when
 * `invitationToken` itself is masked — a VIEWER can see "a personalized
 * link exists" without ever receiving the link's value.
 */
export interface GuestInvitationDetail {
  guestId: string;
  guestName: string;
  category: GuestCategory;
  phone: string | null;
  invitationStatus: GuestInvitationStatus;
  invitationTokenAvailable: boolean;
  invitationToken: string | null;
  role: EventMemberRole;
  event: { id: string; title: string; slug: string };
}

export interface GuestListResult {
  guests: GuestListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GuestListQuery {
  q?: string;
  category?: GuestCategory | "ALL";
  sort?: "name_asc" | "name_desc" | "newest" | "oldest";
  page?: number;
}

export interface CsvImportRowResult {
  rowNumber: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  category: GuestCategory | null;
  seatQuota: number | null;
  notes: string | null;
  status: "valid" | "duplicate" | "invalid";
  errors: string[];
}

export interface CsvImportPreview {
  rows: CsvImportRowResult[];
  importableCount: number;
  duplicateCount: number;
  invalidCount: number;
}

export interface CsvImportSummary {
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
}

export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
