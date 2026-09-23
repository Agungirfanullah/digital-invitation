/**
 * Security response headers, applied to every request via `proxy.ts`.
 *
 * Directive choices are evidence-based, not a generic copy-pasted policy —
 * see docs/DECISIONS.md's Phase 20 entry for the source-by-source
 * reasoning behind each one (which files use inline styles, which surface
 * needs worker-src, why img-src stays broad, etc).
 */

export interface SecurityHeaderOptions {
  /** Per-request nonce for script-src (never logged, never persisted — see buildNonce()). */
  nonce: string;
  isDev: boolean;
  /** Only request-derived (`request.nextUrl.protocol === "https:"`) — never assumed. */
  isHttps: boolean;
}

/**
 * script-src: no real inline-script usage exists in application source
 * (confirmed by audit — the one grep hit is a test-fixture string, not
 * real usage), but Next.js's own App Router injects inline scripts for
 * RSC flight-data streaming/hydration. Those get this nonce automatically
 * (Next.js parses it out of this header at render time) — no per-script
 * code changes needed. 'strict-dynamic' means browsers that support it
 * ignore 'self' and trust only nonce-carrying (or nonce-loaded) scripts.
 *
 * style-src: 9 files (6 templates + 3 shared components) use React's
 * `style={{...}}` prop for per-theme CSS variables — dynamic per-render
 * values with no practical nonce/hash strategy. Deliberately kept
 * 'unsafe-inline'; not presented as fully hardened.
 *
 * img-src: owner-pasted external image/QR URLs are validated only by
 * scheme (`lib/invitations/url-safety.ts`), by design (D-041/D-042) — a
 * domain allowlist would break real invitations. https:/http: stays broad
 * to match that existing validation exactly, nothing broader.
 *
 * connect-src: zero raw `fetch()` calls in components/, and the one
 * client-side Supabase helper (`lib/supabase/client.ts`) has zero callers
 * anywhere — 'self' is sufficient today.
 *
 * worker-src: on browsers without the native BarcodeDetector API (iOS
 * Safari, Firefox, desktop Chrome on Windows/Linux) qr-scanner 1.4.x
 * dynamically imports its worker module (a same-origin chunk, covered by
 * script-src) which then runs
 * `new Worker(URL.createObjectURL(new Blob([...])))` — a `blob:` worker,
 * which `'self'` does not match. `blob:` is the narrowest source that
 * permits it (workers can't be nonced/hashed), and a blob: URL can only be
 * minted by script already trusted by script-src. No other scheme/host is
 * allowed. See docs/DECISIONS.md D-053.
 *
 * font-src: no next/font, no Google Fonts, no @font-face — 'self' only.
 */
export function buildContentSecurityPolicy({ nonce, isDev }: SecurityHeaderOptions): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' https: http: data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `worker-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self'`,
  ];
  return directives.join("; ");
}

/**
 * Camera is required for QR check-in scanning (`qr-scanner`'s
 * getUserMedia-based fallback); everything else this app doesn't use is
 * explicitly denied rather than left to browser defaults.
 */
const PERMISSIONS_POLICY =
  "camera=(self), microphone=(), geolocation=(), payment=(), interest-cohort=()";

/**
 * Returns the full set of security response headers for one request.
 * HSTS is included only when the request itself was HTTPS (matches the
 * existing `request.nextUrl.protocol === "https:"` check proxy.ts already
 * uses for the analytics cookie's `secure` flag) — sending it over plain
 * HTTP localhost dev traffic would be actively wrong. `includeSubDomains`/
 * `preload` are deliberately omitted for this batch: preload registration
 * is a manual, largely irreversible external action outside this batch's
 * scope, and subdomain topology isn't confirmed yet.
 */
export function getSecurityHeaders(options: SecurityHeaderOptions): [string, string][] {
  const headers: [string, string][] = [
    ["Content-Security-Policy", buildContentSecurityPolicy(options)],
    ["X-Content-Type-Options", "nosniff"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["X-Frame-Options", "SAMEORIGIN"],
    ["Permissions-Policy", PERMISSIONS_POLICY],
  ];

  if (options.isHttps) {
    headers.push(["Strict-Transport-Security", "max-age=63072000"]);
  }

  return headers;
}

/**
 * A fresh, cryptographically random, unpredictable nonce per request —
 * never derived from eventId/userId/token, never logged, never persisted.
 * Matches the exact pattern from Next.js's own CSP guide
 * (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 */
export function buildNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}
