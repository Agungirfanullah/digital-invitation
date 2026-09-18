/**
 * Route prefixes that require an authenticated session. Kept separate from
 * proxy.ts so the matching logic can be unit tested without booting a
 * Supabase client.
 */
export const PROTECTED_PATH_PREFIXES = ["/dashboard"] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
