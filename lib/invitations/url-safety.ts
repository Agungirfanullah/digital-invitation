/**
 * Restricts a URL to http(s) only. Used at both the editor's write
 * boundary and the public projection's read boundary — a plain `z.url()`
 * check (or the WHATWG `URL` constructor alone) accepts `javascript:`,
 * `data:`, and `vbscript:` schemes just as happily as `https:`, since
 * those are all syntactically valid URLs. That's fine for values that
 * only ever reach `<img src>` (browsers don't execute script from an
 * image src), but every one of these fields can end up in an `<a href>`
 * (map links, gallery items) where a `javascript:` URL executes on click.
 * Centralized here so "safe URL" means the same thing everywhere it's
 * checked, rather than each call site re-deriving its own definition.
 */
export function toSafeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

export function isSafeHttpUrl(value: string): boolean {
  return toSafeHttpUrl(value) !== null;
}
