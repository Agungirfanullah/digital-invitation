import type { GuestCategory, GuestInvitationStatus } from "@prisma/client";

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
  invitationToken: string;
  invitationStatus: GuestInvitationStatus;
}

export interface GuestDetail extends GuestListItem {
  eventId: string;
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
