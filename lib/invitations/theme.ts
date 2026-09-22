import { z } from "zod";

import { toSafeHttpUrl } from "@/lib/invitations/url-safety";
import type { PublicTheme } from "@/lib/invitations/types";

/**
 * The subset of a `Theme` row `parseTheme` actually reads — deliberately
 * structural (not the full Prisma `Theme` type) so it also accepts the
 * editor's in-memory `EditorTheme` state directly, letting the live
 * preview reuse this exact fallback logic instead of duplicating it.
 */
export interface ThemeColumns {
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  accentColor: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  scriptFont: string | null;
  backgroundImageUrl: string | null;
}

const colorSchema = z.string().trim().min(1).max(64);
const fontSchema = z.string().trim().min(1).max(120);

/**
 * A neutral, warm default — used whenever an event has no `Theme` row, a
 * stored field fails validation, or (see `parseTheme()`) no more specific
 * per-template default applies either. Rendering must never break because
 * of malformed/missing theme data.
 */
export const DEFAULT_THEME: PublicTheme = {
  primaryColor: "#7a5c3e",
  secondaryColor: "#f4ede4",
  backgroundColor: "#fffaf5",
  textColor: "#2b2420",
  accentColor: "#b08968",
  headingFont: "Georgia, 'Times New Roman', serif",
  bodyFont: "'Helvetica Neue', Arial, sans-serif",
  scriptFont: "'Brush Script MT', cursive",
  backgroundImageUrl: null,
};

function safeString(schema: z.ZodTypeAny, value: unknown, fallback: string): string {
  const result = schema.safeParse(value);
  return result.success ? (result.data as string) : fallback;
}

/**
 * Validates a `Theme` row into a render-safe object. Never throws — every
 * field falls back independently rather than a single bad column (or a
 * missing row entirely) breaking the whole page.
 *
 * `fallback` defaults to the global `DEFAULT_THEME` but callers that know
 * which template an event uses should pass that template's own default
 * (see `lib/invitations/templates/default-themes.ts`) — this is what lets
 * an event with no explicit `Theme` row (or an explicit row with some
 * fields left blank) render Dark Luxury's dark palette or Floral
 * Romance's script font out of the box, while an owner-set field for that
 * same event always still wins, field-by-field (docs/DECISIONS.md).
 */
export function parseTheme(
  theme: ThemeColumns | null,
  fallback: PublicTheme = DEFAULT_THEME,
): PublicTheme {
  if (!theme) return { ...fallback };

  const backgroundImageUrl = toSafeHttpUrl(theme.backgroundImageUrl) ?? fallback.backgroundImageUrl;

  return {
    primaryColor: safeString(colorSchema, theme.primaryColor, fallback.primaryColor),
    secondaryColor: safeString(colorSchema, theme.secondaryColor, fallback.secondaryColor),
    backgroundColor: safeString(colorSchema, theme.backgroundColor, fallback.backgroundColor),
    textColor: safeString(colorSchema, theme.textColor, fallback.textColor),
    accentColor: safeString(colorSchema, theme.accentColor, fallback.accentColor),
    headingFont: safeString(fontSchema, theme.headingFont, fallback.headingFont),
    bodyFont: safeString(fontSchema, theme.bodyFont, fallback.bodyFont),
    scriptFont: safeString(fontSchema, theme.scriptFont, fallback.scriptFont),
    backgroundImageUrl,
  };
}
