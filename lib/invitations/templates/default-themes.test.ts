import { describe, expect, it } from "vitest";

import { contrastRatio } from "@/lib/invitations/color-contrast";
import {
  getTemplateDefaultTheme,
  TEMPLATE_DEFAULT_THEMES,
} from "@/lib/invitations/templates/default-themes";
import { DEFAULT_THEME } from "@/lib/invitations/theme";

/** WCAG AA for normal-size body text. */
const WCAG_AA_NORMAL_TEXT = 4.5;

describe("TEMPLATE_DEFAULT_THEMES", () => {
  it("defines a distinct palette for every non-baseline template slug", () => {
    const slugs = Object.keys(TEMPLATE_DEFAULT_THEMES).filter((slug) => slug !== "minimal-elegant");
    expect(slugs.sort()).toEqual(
      [
        "dark-luxury",
        "floral-romance",
        "modern-editorial",
        "soft-romantic",
        "traditional-nusantara",
      ].sort(),
    );
  });

  it("every template's textColor is genuinely readable against its own backgroundColor (WCAG AA)", () => {
    for (const [slug, theme] of Object.entries(TEMPLATE_DEFAULT_THEMES)) {
      const ratio = contrastRatio(theme.textColor, theme.backgroundColor);
      expect(ratio, `${slug}: textColor vs backgroundColor`).not.toBeNull();
      expect(ratio!, `${slug}: contrast ratio ${ratio}`).toBeGreaterThanOrEqual(
        WCAG_AA_NORMAL_TEXT,
      );
    }
  });

  it("no two templates share an identical color palette", () => {
    const paletteKeys = Object.values(TEMPLATE_DEFAULT_THEMES).map((theme) =>
      [
        theme.primaryColor,
        theme.secondaryColor,
        theme.backgroundColor,
        theme.textColor,
        theme.accentColor,
      ].join("|"),
    );
    expect(new Set(paletteKeys).size).toBe(paletteKeys.length);
  });
});

describe("getTemplateDefaultTheme", () => {
  it("returns the minimal-elegant entry (the existing global default) for that slug", () => {
    expect(getTemplateDefaultTheme("minimal-elegant")).toBe(DEFAULT_THEME);
  });

  it("returns each new template's own distinct default", () => {
    expect(getTemplateDefaultTheme("dark-luxury").backgroundColor).toBe("#121110");
    expect(getTemplateDefaultTheme("floral-romance").scriptFont).not.toBe(DEFAULT_THEME.scriptFont);
  });

  it("falls back to the global default for an unknown or null slug", () => {
    expect(getTemplateDefaultTheme("not-a-real-template")).toBe(DEFAULT_THEME);
    expect(getTemplateDefaultTheme(null)).toBe(DEFAULT_THEME);
  });
});
