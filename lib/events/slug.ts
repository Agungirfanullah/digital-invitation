/**
 * Derives a URL-safe slug suggestion from free text (e.g. an event title).
 * Pure and framework-agnostic so it can run both in the browser (live
 * suggestion while typing) and on the server (defense in depth — the
 * server never trusts a client-supplied slug without also re-validating
 * it against `slugSchema`).
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
