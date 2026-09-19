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
 * A neutral, warm default — used whenever an event has no `Theme` row, or
 * a stored field fails validation. Rendering must never break because of
 * malformed/missing theme data.
 */
const DEFAULT_THEME: PublicTheme = {
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
 * field falls back independently to `DEFAULT_THEME` rather than a single
 * bad column (or a missing row entirely) breaking the whole page.
 */
export function parseTheme(theme: ThemeColumns | null): PublicTheme {
  if (!theme) return { ...DEFAULT_THEME };

  const backgroundImageUrl = toSafeHttpUrl(theme.backgroundImageUrl);

  return {
    primaryColor: safeString(colorSchema, theme.primaryColor, DEFAULT_THEME.primaryColor),
    secondaryColor: safeString(colorSchema, theme.secondaryColor, DEFAULT_THEME.secondaryColor),
    backgroundColor: safeString(colorSchema, theme.backgroundColor, DEFAULT_THEME.backgroundColor),
    textColor: safeString(colorSchema, theme.textColor, DEFAULT_THEME.textColor),
    accentColor: safeString(colorSchema, theme.accentColor, DEFAULT_THEME.accentColor),
    headingFont: safeString(fontSchema, theme.headingFont, DEFAULT_THEME.headingFont),
    bodyFont: safeString(fontSchema, theme.bodyFont, DEFAULT_THEME.bodyFont),
    scriptFont: safeString(fontSchema, theme.scriptFont, DEFAULT_THEME.scriptFont),
    backgroundImageUrl,
  };
}
