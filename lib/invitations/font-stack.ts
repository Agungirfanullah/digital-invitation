/**
 * Web fonts the templates' default themes name, each self-hosted through
 * `next/font` in `app/template-fonts.ts` and exposed as a CSS variable on
 * `<html>`. Theme font stacks keep the plain family names (they are stored
 * and shown in the editor); `resolveFontStack()` swaps each known name for
 * its variable when the stack is applied, because `next/font` serves the
 * files under a generated family name. Keep this list and
 * `app/template-fonts.ts` in step.
 */
export const TEMPLATE_FONT_VARIABLES: Record<string, string> = {
  "Playfair Display": "--font-playfair-display",
  Marcellus: "--font-marcellus",
  "Libre Baskerville": "--font-libre-baskerville",
  Fraunces: "--font-fraunces",
  "Crimson Text": "--font-crimson-text",
  "Cormorant Garamond": "--font-cormorant-garamond",
  Cinzel: "--font-cinzel",
  "Bodoni Moda": "--font-bodoni-moda",
  "Bebas Neue": "--font-bebas-neue",
  "Baloo 2": "--font-baloo-2",
  Quicksand: "--font-quicksand",
  Oswald: "--font-oswald",
  "Special Elite": "--font-special-elite",
  Inter: "--font-inter",
  "Dancing Script": "--font-dancing-script",
  Caveat: "--font-caveat",
  Allura: "--font-allura",
  "Great Vibes": "--font-great-vibes",
};

const QUOTED_FAMILY = /(['"])([^'"]+)\1/g;

/**
 * "'Playfair Display', Georgia, serif" ->
 * "var(--font-playfair-display, 'Playfair Display'), Georgia, serif".
 * Unknown families (system fonts, an owner's custom stack) are left as they
 * are; the plain name stays as the variable's fallback, so the stack still
 * works where the variables are not defined (tests, image generation).
 */
export function resolveFontStack(stack: string): string {
  return stack.replace(QUOTED_FAMILY, (match, _quote: string, family: string) => {
    const variable = TEMPLATE_FONT_VARIABLES[family];
    return variable ? `var(${variable}, ${match})` : match;
  });
}
