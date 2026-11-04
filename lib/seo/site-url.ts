/**
 * The site's public origin from NEXT_PUBLIC_APP_URL, for absolute URLs in
 * robots.txt and sitemap.xml. Null when the variable is unset or malformed,
 * so those files degrade instead of failing the build.
 */
export function siteOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").origin;
  } catch {
    return null;
  }
}
