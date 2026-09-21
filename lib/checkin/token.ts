import "server-only";

import { guestTokenSchema } from "@/lib/invitations/token";

/**
 * Server-only parsing of whatever raw string the camera decoder hands
 * back. The client never extracts or interprets the token itself — it
 * only decodes the QR into a plain string and sends that string,
 * untouched, to the server ("the server must resolve the invitation
 * token itself"). Phase 13's QR always encodes the full personalized
 * invitation URL (`buildGuestInvitationUrl()`'s output — `/invite/[slug]
 * ?to=[token]`), never a bare token — so this deliberately only accepts
 * that exact shape (a parseable URL with a `to` query param that itself
 * passes the existing token-format check) and returns `null` for
 * anything else, including a bare/unwrapped token string. This keeps the
 * scanner's input surface identical to what the QR feature actually
 * produces, rather than accepting a second, looser input shape.
 *
 * The extracted event slug embedded in the URL is deliberately never
 * read or trusted here — the token itself is resolved and cross-checked
 * against the authorized event server-side (lib/checkin/service.ts),
 * exactly like lib/rsvp/service.ts's resolveGuestForRsvp() and
 * lib/wishes/service.ts's resolveGuestForWish() already do. A mismatched
 * or absent slug in the scanned URL has no bearing on the actual
 * security check.
 */
export function extractInvitationTokenFromScannedValue(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const rawToken = url.searchParams.get("to");
  if (!rawToken) return null;

  const parsed = guestTokenSchema.safeParse(rawToken);
  return parsed.success ? parsed.data : null;
}
