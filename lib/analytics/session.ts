/**
 * Pure, dependency-free helpers for the analytics session cookie and
 * request classification — kept separate from `proxy.ts` and
 * `lib/analytics/service.ts` so they can be unit tested without booting
 * Prisma or a request/response object, mirroring
 * `lib/supabase/route-protection.ts`'s `isProtectedPath()`.
 */

/** First-party, HttpOnly, opaque anonymous visitor identifier — never a guest id, never an invitation token, never PII. See docs/DECISIONS.md's Phase 15 entry. */
export const ANALYTICS_SESSION_COOKIE_NAME = "di_analytics_sid";

/**
 * Scoped to `/invite` only (never sent to `/dashboard` or any other path)
 * and to 90 days — long enough to span an invitation's realistic
 * lifecycle (sent weeks before an event, opened again after), short
 * enough to keep this a bounded, non-permanent identifier rather than an
 * indefinite tracking cookie. `secure` is conditional so local HTTP
 * development still works; every real deployment target (Vercel) serves
 * over HTTPS.
 */
export const ANALYTICS_SESSION_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

export function getAnalyticsSessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/invite",
    maxAge: ANALYTICS_SESSION_COOKIE_MAX_AGE_SECONDS,
  };
}

const ANALYTICS_PATH_PREFIXES = ["/invite"] as const;

export function isPublicInvitationPath(pathname: string): boolean {
  return ANALYTICS_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export type DeviceType = "MOBILE" | "TABLET" | "DESKTOP" | "UNKNOWN";

/**
 * A lightweight, server-side-only classification — not a full user-agent
 * parsing library (none is warranted for a "mobile vs. tablet vs.
 * desktop" summary stat). The raw user-agent string itself is never
 * stored, only this small, controlled classification (docs/PRD.md §35:
 * "Do not collect unnecessary personal data").
 */
export function classifyDeviceType(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return "UNKNOWN";
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet|kindle|playbook|silk/.test(ua)) return "TABLET";
  if (/mobi|iphone|ipod|android.*mobile|blackberry|windows phone/.test(ua)) return "MOBILE";
  return "DESKTOP";
}

/**
 * Reduces a `Referer` header to just its origin (scheme + host), never
 * the full URL — the referring page's own path/query could itself carry
 * that site's tracking parameters or other incidental data this app has
 * no reason to store. Returns `null` for anything empty, unparseable, or
 * missing.
 */
export function normalizeReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.origin.slice(0, 200);
  } catch {
    return null;
  }
}
