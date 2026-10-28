/**
 * Homepage-only grouping of templates by visual style, for the Template
 * Showcase filter. Presentation copy, not product data: it is not stored in
 * the database, and a template missing here still shows under "Semua".
 */
export const TEMPLATE_STYLES = ["Elegan", "Romantis", "Modern", "Tradisional", "Ceria"] as const;

export type TemplateStyle = (typeof TEMPLATE_STYLES)[number];

const STYLE_BY_SLUG: Record<string, TemplateStyle> = {
  "minimal-elegant": "Elegan",
  "royal-gold": "Elegan",
  "art-deco": "Elegan",
  "dark-luxury": "Elegan",
  "floral-romance": "Romantis",
  "soft-romantic": "Romantis",
  "blue-bloom": "Romantis",
  "garden-tropical": "Romantis",
  "modern-editorial": "Modern",
  "mono-frame": "Modern",
  "industrial-loft": "Modern",
  "cinematic-journey": "Modern",
  "traditional-nusantara": "Tradisional",
  "rustic-earth": "Tradisional",
  "vintage-sepia": "Tradisional",
  "playful-pop": "Ceria",
};

export function templateStyle(slug: string): TemplateStyle | null {
  return STYLE_BY_SLUG[slug] ?? null;
}
