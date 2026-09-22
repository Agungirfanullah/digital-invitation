/**
 * Small, dependency-free color-contrast helpers — no new npm package, just
 * the standard WCAG relative-luminance formula. Used to (a) automatically
 * pick a readable foreground for an owner/template-chosen color the app
 * has no control over (see `components/invitation/theme-vars.ts`), and
 * (b) verify each template's own default text/background pairing
 * actually meets WCAG AA in a real, automated test rather than by eye
 * (see `lib/invitations/templates/default-themes.test.ts`).
 */

function hexToRgb(color: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color.trim());
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function channelLuminance(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance (0 = black, 1 = white). Returns `null` for a color string this can't parse as hex (e.g. a named color or `oklch()`), since the app never controls the exact format an owner types into the theme editor. */
export function relativeLuminance(color: string): number | null {
  const rgb = hexToRgb(color);
  if (!rgb) return null;
  const [r, g, b] = rgb;
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG contrast ratio between two colors, 1 (no contrast) to 21 (max). Returns `null` if either color isn't parseable. */
export function contrastRatio(colorA: string, colorB: string): number | null {
  const lumA = relativeLuminance(colorA);
  const lumB = relativeLuminance(colorB);
  if (lumA === null || lumB === null) return null;
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks whichever of near-black/near-white has higher contrast against
 * `background` — used for text that must sit on an arbitrary,
 * owner-or-template-chosen background color (e.g. a button's own label).
 * Falls back to `fallback` (typically the theme's own body text color)
 * when `background` isn't a parseable hex color, rather than guessing.
 */
export function resolveReadableForeground(background: string, fallback: string): string {
  const luminance = relativeLuminance(background);
  if (luminance === null) return fallback;

  const contrastWithWhite = (1 + 0.05) / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / (0 + 0.05);
  return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#0a0a0a";
}
