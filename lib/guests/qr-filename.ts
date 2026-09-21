import { slugify } from "@/lib/events/slug";

/**
 * Builds a safe, guest-name-derived filename for a downloaded QR file.
 * Deliberately takes only `guestName` (never the invitation token/URL) —
 * the filename must never leak the token, matching the same "never expose
 * the token" boundary the rest of the guest-invitation feature already
 * enforces. Reuses `lib/events/slug.ts`'s existing `slugify()` rather than
 * duplicating diacritic-stripping/slug logic.
 */
export function buildGuestQrFileName(guestName: string): string {
  const slug = slugify(guestName);
  return `qr-undangan-${slug || "tamu"}.svg`;
}
