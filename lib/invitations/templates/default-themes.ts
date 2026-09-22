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
};

/** Unknown/null slugs fall back to the same global default `parseTheme()` has always used — never throws, never renders with a missing palette. */
export function getTemplateDefaultTheme(templateSlug: string | null): PublicTheme {
  if (!templateSlug) return DEFAULT_THEME;
  return TEMPLATE_DEFAULT_THEMES[templateSlug] ?? DEFAULT_THEME;
}
