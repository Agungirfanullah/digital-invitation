import type { MetadataRoute } from "next";

import { siteOrigin } from "@/lib/seo/site-url";

/**
 * Crawlers may read the marketing pages and template demos. Private areas
 * are disallowed. `/invite/` is deliberately NOT disallowed: customer
 * invitations carry `noindex` (D-094), and a crawler blocked from fetching
 * a page never sees that tag, so the URL could still be listed.
 */
export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/onboarding", "/api/", "/reset-password"],
    },
    ...(origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  };
}
