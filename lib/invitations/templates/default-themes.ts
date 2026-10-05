import { DEFAULT_THEME } from "@/lib/invitations/theme";
import type { PublicTheme } from "@/lib/invitations/types";

/**
 * Each template's own out-of-the-box palette/typography — used only as a
 * per-field fallback when an event has no explicit `Theme` row (or a
 * field the owner left blank). An owner-set field always wins; see
 * `lib/invitations/theme.ts`'s `parseTheme()` and
 * `lib/invitations/projection.ts`. Deliberately plain data (no React
 * import) so it can be resolved server-side before the DTO is built,
 * without pulling template *components* into the data layer.
 *
 * Colors/fonts here are picked to satisfy each template's own design
 * brief (see the Phase 3 design audit) and to keep body text readable
 * against its own background — see `lib/invitations/color-contrast.ts`
 * and `lib/invitations/templates/default-themes.test.ts` for the actual
 * WCAG contrast-ratio check, not just visual inspection.
 */
export const TEMPLATE_DEFAULT_THEMES: Record<string, PublicTheme> = {
  "minimal-elegant": DEFAULT_THEME,

  "modern-editorial": {
    primaryColor: "#0a0a0a",
    secondaryColor: "#e5e5e0",
    backgroundColor: "#fafaf8",
    textColor: "#1a1a1a",
    accentColor: "#b3261e",
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    scriptFont: "Georgia, serif",
    backgroundImageUrl: null,
  },

  "floral-romance": {
    primaryColor: "#7d5a50",
    secondaryColor: "#f2e6dc",
    backgroundColor: "#fff9f5",
    textColor: "#4a3f3a",
    accentColor: "#c98a8a",
    headingFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "'Brush Script MT', 'Segoe Script', cursive",
    backgroundImageUrl: null,
  },

  "dark-luxury": {
    primaryColor: "#f5efe0",
    secondaryColor: "#2a2a28",
    backgroundColor: "#121110",
    textColor: "#ece7de",
    accentColor: "#c9a86a",
    headingFont: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "Georgia, serif",
    backgroundImageUrl: null,
  },

  "traditional-nusantara": {
    primaryColor: "#8a4b28",
    secondaryColor: "#e8d5b5",
    backgroundColor: "#fbf3e7",
    textColor: "#3b2a1a",
    accentColor: "#b8860b",
    headingFont: "Georgia, 'Times New Roman', serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "Georgia, serif",
    backgroundImageUrl: null,
  },

  "soft-romantic": {
    primaryColor: "#c98ea3",
    secondaryColor: "#f7e6ec",
    backgroundColor: "#fffbfa",
    textColor: "#5a4a4f",
    accentColor: "#d9a5b3",
    headingFont: "'Quicksand', 'Helvetica Neue', Arial, sans-serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "'Brush Script MT', 'Segoe Script', cursive",
    backgroundImageUrl: null,
  },

  "cinematic-journey": {
    primaryColor: "#2b2420",
    secondaryColor: "#e8ded0",
    backgroundColor: "#faf6ef",
    textColor: "#3a332c",
    accentColor: "#a67c3d",
    headingFont: "'Bodoni Moda', 'Playfair Display', Georgia, serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "Georgia, serif",
    backgroundImageUrl: null,
  },

  "rustic-earth": {
    primaryColor: "#6b4226",
    secondaryColor: "#ead9c3",
    backgroundColor: "#fdf8f0",
    textColor: "#4a3528",
    accentColor: "#8a9a5b",
    headingFont: "'Fraunces', Georgia, serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "'Caveat', 'Segoe Script', cursive",
    backgroundImageUrl: null,
  },

  "playful-pop": {
    primaryColor: "#e8505b",
    secondaryColor: "#ffe8a3",
    backgroundColor: "#fffdf7",
    textColor: "#2d2a26",
    accentColor: "#2f9e90",
    headingFont: "'Baloo 2', 'Arial Rounded MT Bold', 'Helvetica Neue', sans-serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "Georgia, serif",
    backgroundImageUrl: null,
  },

  "royal-gold": {
    primaryColor: "#1b2a4a",
    secondaryColor: "#e3d9b8",
    backgroundColor: "#faf7ef",
    textColor: "#2a2419",
    accentColor: "#ab8427",
    headingFont: "'Marcellus', 'Playfair Display', Georgia, serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "Georgia, serif",
    backgroundImageUrl: null,
  },

  "blue-bloom": {
    primaryColor: "#3b5a7a",
    secondaryColor: "#dce8f0",
    backgroundColor: "#f7fafc",
    textColor: "#2e3d4d",
    accentColor: "#7fa8c9",
    headingFont: "'Libre Baskerville', Georgia, serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "'Dancing Script', 'Segoe Script', cursive",
    backgroundImageUrl: null,
  },

  "mono-frame": {
    primaryColor: "#000000",
    secondaryColor: "#d4d4d4",
    backgroundColor: "#ffffff",
    textColor: "#111111",
    accentColor: "#404040",
    headingFont: "'Bebas Neue', 'Arial Narrow', Arial, sans-serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "Georgia, serif",
    backgroundImageUrl: null,
  },

  "garden-tropical": {
    primaryColor: "#2f5233",
    secondaryColor: "#d4e4d0",
    backgroundColor: "#f8faf5",
    textColor: "#293830",
    accentColor: "#4a8068",
    headingFont: "'Crimson Text', Georgia, serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "'Allura', 'Brush Script MT', cursive",
    backgroundImageUrl: null,
  },

  "art-deco": {
    primaryColor: "#1a1a1a",
    secondaryColor: "#e8ddc0",
    backgroundColor: "#f5f0e6",
    textColor: "#1a1a1a",
    accentColor: "#c8a24a",
    headingFont: "'Cinzel', Georgia, serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "Georgia, serif",
    backgroundImageUrl: null,
  },

  "vintage-sepia": {
    primaryColor: "#5c4a3f",
    secondaryColor: "#e8dcc8",
    backgroundColor: "#f5ecd9",
    textColor: "#43362c",
    accentColor: "#a67856",
    headingFont: "'Special Elite', 'Courier New', monospace",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "Georgia, serif",
    backgroundImageUrl: null,
  },

  "industrial-loft": {
    primaryColor: "#2b2b2b",
    secondaryColor: "#c4c4c0",
    backgroundColor: "#ececea",
    textColor: "#1f1f1f",
    accentColor: "#8a7f6a",
    headingFont: "'Oswald', 'Arial Narrow', Arial, sans-serif",
    bodyFont: "'Helvetica Neue', Arial, sans-serif",
    scriptFont: "Georgia, serif",
    backgroundImageUrl: null,
  },
};

/** Unknown/null slugs fall back to the same global default `parseTheme()` has always used — never throws, never renders with a missing palette. */
export function getTemplateDefaultTheme(templateSlug: string | null): PublicTheme {
  if (!templateSlug) return DEFAULT_THEME;
  return TEMPLATE_DEFAULT_THEMES[templateSlug] ?? DEFAULT_THEME;
}
