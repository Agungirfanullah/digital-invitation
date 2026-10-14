/**
 * Curated choices behind the editor's "Warna & Font" form, so owners pick a
 * named color or a font from a list instead of typing hex codes and CSS
 * font stacks. Values stay exactly what the theme already stores (a hex
 * string, a CSS font-family string), so the schema, the database and the
 * renderer are unchanged.
 *
 * Fonts are system font stacks on purpose: the CSP allows `font-src 'self'`
 * only and no web font is loaded for invitations, so a font that is not
 * installed on the guest's device would silently fall back. Every stack
 * ends in a generic family, so the fallback is always the same style.
 */

export interface ColorPreset {
  name: string;
  hex: string;
}

export const COLOR_PRESETS: readonly ColorPreset[] = [
  { name: "Putih", hex: "#ffffff" },
  { name: "Gading", hex: "#fffaf5" },
  { name: "Krem", hex: "#f5ecd9" },
  { name: "Pasir", hex: "#e8dcc8" },
  { name: "Emas", hex: "#c9a227" },
  { name: "Tembaga", hex: "#a67856" },
  { name: "Cokelat", hex: "#5c4a3f" },
  { name: "Arang", hex: "#2b2420" },
  { name: "Hitam", hex: "#111111" },
  { name: "Marun", hex: "#7b2d3b" },
  { name: "Mawar", hex: "#d8a7a7" },
  { name: "Merah Muda", hex: "#f4c2c2" },
  { name: "Hijau Sage", hex: "#9caf88" },
  { name: "Hijau Zamrud", hex: "#0f6b4f" },
  { name: "Hijau Tua", hex: "#1f3d2b" },
  { name: "Biru Langit", hex: "#a9c9e8" },
  { name: "Biru Navy", hex: "#1f2f4d" },
  { name: "Lavender", hex: "#b7a6d8" },
];

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `#rrggbb` (lowercase) for a 3- or 6-digit hex string, otherwise `null`. */
export function normalizeHex(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? "";
  if (!HEX_PATTERN.test(raw)) return null;
  const digits = raw.slice(1).toLowerCase();
  return digits.length === 3
    ? `#${digits
        .split("")
        .map((digit) => digit + digit)
        .join("")}`
    : `#${digits}`;
}

/** The preset's name when the color is one of ours, otherwise `null`. */
export function findColorPresetName(value: string | null | undefined): string | null {
  const hex = normalizeHex(value);
  if (!hex) return null;
  return COLOR_PRESETS.find((preset) => preset.hex === hex)?.name ?? null;
}

export interface FontOption {
  label: string;
  stack: string;
}

export interface FontGroup {
  label: string;
  options: readonly FontOption[];
}

export const FONT_GROUPS: readonly FontGroup[] = [
  {
    label: "Klasik (berkaki)",
    options: [
      { label: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
      { label: "Times New Roman", stack: "'Times New Roman', Times, serif" },
      { label: "Palatino", stack: "'Palatino Linotype', Palatino, 'Book Antiqua', serif" },
      { label: "Garamond", stack: "Garamond, 'Times New Roman', serif" },
      { label: "Baskerville", stack: "Baskerville, 'Baskerville Old Face', Georgia, serif" },
    ],
  },
  {
    label: "Modern (tanpa kaki)",
    options: [
      { label: "Helvetica / Arial", stack: "'Helvetica Neue', Arial, sans-serif" },
      { label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
      { label: "Trebuchet", stack: "'Trebuchet MS', 'Lucida Grande', sans-serif" },
      { label: "Gill Sans", stack: "'Gill Sans', 'Gill Sans MT', Calibri, sans-serif" },
    ],
  },
  {
    label: "Tulisan tangan",
    options: [
      { label: "Brush Script", stack: "'Brush Script MT', 'Segoe Script', cursive" },
      {
        label: "Snell Roundhand",
        stack: "'Snell Roundhand', 'Apple Chancery', 'Brush Script MT', cursive",
      },
      {
        label: "Lucida Handwriting",
        stack: "'Lucida Handwriting', 'Lucida Calligraphy', cursive",
      },
    ],
  },
  {
    label: "Mesin ketik",
    options: [{ label: "Courier New", stack: "'Courier New', Courier, monospace" }],
  },
];

export function findFontOption(stack: string | null | undefined): FontOption | null {
  if (!stack) return null;
  for (const group of FONT_GROUPS) {
    const match = group.options.find((option) => option.stack === stack);
    if (match) return match;
  }
  return null;
}
