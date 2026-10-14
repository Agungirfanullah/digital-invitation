import { describe, expect, it } from "vitest";

import { themeSchema } from "@/lib/editor/validation";
import {
  COLOR_PRESETS,
  FONT_GROUPS,
  findColorPresetName,
  findFontOption,
  normalizeHex,
} from "@/lib/invitations/theme-options";

describe("normalizeHex", () => {
  it("lowercases 6-digit hex and expands 3-digit hex", () => {
    expect(normalizeHex("#A67856")).toBe("#a67856");
    expect(normalizeHex("#fa0")).toBe("#ffaa00");
  });

  it("rejects anything that is not a hex color", () => {
    for (const value of ["red", "rgb(1,2,3)", "#12", "#12345", "#gggggg", "", null, undefined]) {
      expect(normalizeHex(value), String(value)).toBeNull();
    }
  });
});

describe("findColorPresetName", () => {
  it("names a preset regardless of letter case", () => {
    expect(findColorPresetName("#C9A227")).toBe("Emas");
  });

  it("returns null for a color outside the palette", () => {
    expect(findColorPresetName("#123456")).toBeNull();
    expect(findColorPresetName(null)).toBeNull();
  });
});

describe("palette and font list", () => {
  it("has unique preset colors that are all valid hex", () => {
    const hexes = COLOR_PRESETS.map((preset) => preset.hex);
    expect(new Set(hexes).size).toBe(hexes.length);
    for (const hex of hexes) expect(normalizeHex(hex), hex).toBe(hex);
  });

  it("only offers values the server accepts when saving the theme", () => {
    const base = {
      primaryColor: null,
      secondaryColor: null,
      backgroundColor: null,
      textColor: null,
      accentColor: null,
      headingFont: null,
      bodyFont: null,
      scriptFont: null,
      backgroundImageUrl: null,
    };
    for (const { hex } of COLOR_PRESETS) {
      expect(themeSchema.safeParse({ ...base, primaryColor: hex }).success, hex).toBe(true);
    }
    for (const group of FONT_GROUPS) {
      for (const { stack } of group.options) {
        expect(themeSchema.safeParse({ ...base, headingFont: stack }).success, stack).toBe(true);
      }
    }
  });

  it("ends every font stack in a generic family, so a missing font still looks right", () => {
    for (const group of FONT_GROUPS) {
      for (const { stack } of group.options) {
        expect(stack, stack).toMatch(/(serif|sans-serif|cursive|monospace)$/);
      }
    }
  });

  it("finds a font by its stack", () => {
    expect(findFontOption("Georgia, 'Times New Roman', serif")?.label).toBe("Georgia");
    expect(findFontOption("'Playfair Display', Georgia, serif")).toBeNull();
    expect(findFontOption(null)).toBeNull();
  });
});
