import {
  Allura,
  Baloo_2,
  Bebas_Neue,
  Bodoni_Moda,
  Caveat,
  Cinzel,
  Cormorant_Garamond,
  Crimson_Text,
  Dancing_Script,
  Fraunces,
  Great_Vibes,
  Inter,
  Libre_Baskerville,
  Marcellus,
  Oswald,
  Playfair_Display,
  Quicksand,
  Special_Elite,
} from "next/font/google";

/**
 * The invitation templates' web fonts, self-hosted by `next/font` (served
 * from this site, so the `font-src 'self'` CSP allows them). `preload:
 * false`: a page downloads a font file only when something on it actually
 * uses that family, so the dashboard and marketing pages stay light. The
 * variable names must match `lib/invitations/font-stack.ts`.
 *
 * next/font requires each loader call to be its own module-level const with
 * literal options, so the shared options are repeated rather than spread.
 */
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-playfair-display",
});
const marcellus = Marcellus({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--font-marcellus",
});
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-fraunces",
});
const crimsonText = Crimson_Text({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["400", "600", "700"],
  variable: "--font-crimson-text",
});
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
});
const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-cinzel",
});
const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-bodoni-moda",
});
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--font-bebas-neue",
});
const baloo2 = Baloo_2({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-baloo-2",
});
const quicksand = Quicksand({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-quicksand",
});
const oswald = Oswald({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-oswald",
});
const specialElite = Special_Elite({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--font-special-elite",
});
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-inter",
});
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-dancing-script",
});
const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-caveat",
});
const allura = Allura({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--font-allura",
});
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--font-great-vibes",
});

/** Class names that define every template font variable; set on `<html>`. */
export const templateFontVariables = [
  playfairDisplay,
  marcellus,
  libreBaskerville,
  fraunces,
  crimsonText,
  cormorantGaramond,
  cinzel,
  bodoniModa,
  bebasNeue,
  baloo2,
  quicksand,
  oswald,
  specialElite,
  inter,
  dancingScript,
  caveat,
  allura,
  greatVibes,
]
  .map((font) => font.variable)
  .join(" ");
