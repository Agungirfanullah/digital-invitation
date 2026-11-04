import type { MetadataRoute } from "next";

import { TEMPLATE_KEYS } from "@/lib/invitations/templates/registry";
import { siteOrigin } from "@/lib/seo/site-url";

/**
 * Public pages worth indexing: the homepage, every template demo, the
 * sign-up page and the legal pages. Customer invitations are never listed (D-094).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  if (!origin) return [];

  return [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
    ...TEMPLATE_KEYS.map((slug) => ({
      url: `${origin}/demo/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${origin}/register`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${origin}/kebijakan-privasi`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/syarat-ketentuan`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
