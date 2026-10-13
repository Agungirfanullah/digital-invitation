import { describe, expect, it } from "vitest";

import { buildFullyPopulatedInvitation } from "@/components/invitation/templates/test-fixtures";
import {
  OG_BRAND_COLORS,
  buildOgCard,
  headingFontSizeFor,
  safeColor,
  truncate,
} from "@/lib/invitations/og-card";
import { TEMPLATE_DEFAULT_THEMES } from "@/lib/invitations/templates/default-themes";

const trustNothing = { isTrustedPhotoUrl: () => false };
const trustEverything = { isTrustedPhotoUrl: () => true };

describe("safeColor", () => {
  it("accepts 3- and 6-digit hex, trimmed", () => {
    expect(safeColor("#abc", "#000000")).toBe("#abc");
    expect(safeColor(" #A1B2C3 ", "#000000")).toBe("#A1B2C3");
  });

  it("falls back for anything that is not plain hex", () => {
    for (const bad of [
      "red",
      "rgb(0,0,0)",
      "var(--x)",
      "url(http://x)",
      "#12",
      "#12345g",
      "",
      null,
    ]) {
      expect(safeColor(bad, "#111111")).toBe("#111111");
    }
  });

  it("every shipped template default theme uses plain hex colors, so none ever falls back", () => {
    for (const [slug, theme] of Object.entries(TEMPLATE_DEFAULT_THEMES)) {
      for (const key of ["primaryColor", "backgroundColor", "textColor", "accentColor"] as const) {
        expect(safeColor(theme[key], "FALLBACK"), `${slug}.${key}`).toBe(theme[key]);
      }
    }
  });
});

describe("truncate / headingFontSizeFor", () => {
  it("collapses whitespace and truncates with an ellipsis within the limit", () => {
    expect(truncate("  Ayu   &  Budi ", 90)).toBe("Ayu & Budi");
    const long = truncate("x".repeat(200), 90);
    expect(long).toHaveLength(90);
    expect(long.endsWith("…")).toBe(true);
  });

  it("shrinks with length, and further when a photo narrows the text column", () => {
    expect(headingFontSizeFor("Ayu & Budi", false)).toBeGreaterThan(
      headingFontSizeFor("Pernikahan Ayu Lestari dan Budi Santoso", false),
    );
    expect(headingFontSizeFor("Ayu & Budi", true)).toBeLessThan(
      headingFontSizeFor("Ayu & Budi", false),
    );
  });
});

describe("buildOgCard", () => {
  it("uses the hero heading, event type label and the first schedule's date", () => {
    const card = buildOgCard(buildFullyPopulatedInvitation(), trustNothing);

    expect(card.typeLabel).toBe("Pernikahan");
    expect(card.heading.length).toBeGreaterThan(0);
    expect(card.dateLabel).toMatch(/2026/);
  });

  it("omits the date when the Schedule section is off (D-064) and uses no stale value", () => {
    const base = buildFullyPopulatedInvitation();
    const card = buildOgCard(
      { ...base, sections: { ...base.sections, schedule: false } },
      trustNothing,
    );
    expect(card.dateLabel).toBeNull();
  });

  it("falls back to the event title when the Identity section is off", () => {
    const base = buildFullyPopulatedInvitation({ title: "Judul Acara Uji" });
    const card = buildOgCard(
      { ...base, sections: { ...base.sections, identity: false } },
      trustNothing,
    );
    expect(card.heading).toBe("Judul Acara Uji");
  });

  it("embeds the cover photo only when the URL is trusted", () => {
    const base = buildFullyPopulatedInvitation();
    const withPhoto = {
      ...base,
      theme: { ...base.theme, backgroundImageUrl: "http://169.254.169.254/latest/meta-data" },
    };

    expect(buildOgCard(withPhoto, trustNothing).photoUrl).toBeNull();
    expect(buildOgCard(withPhoto, trustEverything).photoUrl).toBe(
      "http://169.254.169.254/latest/meta-data",
    );
  });

  it("never lets a hostile theme value through to the renderer", () => {
    const base = buildFullyPopulatedInvitation();
    const card = buildOgCard(
      {
        ...base,
        theme: {
          ...base.theme,
          backgroundColor: "url(http://evil.example/x)",
          textColor: "var(--secret)",
          primaryColor: "expression(alert(1))",
          accentColor: "javascript:alert(1)",
        },
      },
      trustNothing,
    );

    expect(card.colors.background).toBe(OG_BRAND_COLORS.background);
    expect(card.colors.text).toBe(OG_BRAND_COLORS.text);
    expect(card.colors.primary).toBe(OG_BRAND_COLORS.primary);
    expect(card.colors.accent).toBe(OG_BRAND_COLORS.primary);
  });

  it("is guest-independent: a personalized invitation yields the same card as an anonymous one", () => {
    const base = buildFullyPopulatedInvitation();
    const anonymous = buildOgCard({ ...base, guest: null }, trustNothing);
    const personalized = buildOgCard(
      { ...base, guest: { displayName: "Dewi Rahasia" } },
      trustNothing,
    );

    expect(personalized).toEqual(anonymous);
    expect(JSON.stringify(personalized)).not.toContain("Dewi Rahasia");
  });
});
