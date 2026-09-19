import { describe, expect, it } from "vitest";
import type { Theme } from "@prisma/client";

import { parseTheme } from "@/lib/invitations/theme";

function fakeTheme(overrides: Partial<Theme> = {}): Theme {
  return {
    id: "theme-1",
    eventId: "event-1",
    primaryColor: "#111111",
    secondaryColor: "#222222",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    accentColor: "#abcdef",
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    scriptFont: "Pacifico",
    backgroundImageUrl: "https://example.com/bg.jpg",
    configuration: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("parseTheme", () => {
  it("returns sensible defaults when there is no Theme row", () => {
    const theme = parseTheme(null);
    expect(theme.primaryColor).toBeTruthy();
    expect(theme.backgroundImageUrl).toBeNull();
  });

  it("passes through valid fields from a real Theme row", () => {
    const theme = parseTheme(fakeTheme());
    expect(theme.primaryColor).toBe("#111111");
    expect(theme.headingFont).toBe("Playfair Display");
    expect(theme.backgroundImageUrl).toBe("https://example.com/bg.jpg");
  });

  it("falls back to the default for a null/empty color field rather than rendering with an empty color", () => {
    const theme = parseTheme(fakeTheme({ primaryColor: null }));
    expect(theme.primaryColor).not.toBe("");
    expect(theme.primaryColor).toBeTruthy();
  });

  it("falls back to null for a malformed background image URL rather than throwing", () => {
    const theme = parseTheme(fakeTheme({ backgroundImageUrl: "not-a-url" }));
    expect(theme.backgroundImageUrl).toBeNull();
  });

  it("falls back to null when the background image URL is missing", () => {
    const theme = parseTheme(fakeTheme({ backgroundImageUrl: null }));
    expect(theme.backgroundImageUrl).toBeNull();
  });

  it("rejects a javascript: background image URL rather than passing it through", () => {
    const theme = parseTheme(fakeTheme({ backgroundImageUrl: "javascript:alert(1)" }));
    expect(theme.backgroundImageUrl).toBeNull();
  });

  it("never throws regardless of field combination", () => {
    expect(() =>
      parseTheme(
        fakeTheme({
          primaryColor: null,
          secondaryColor: null,
          backgroundColor: null,
          textColor: null,
          accentColor: null,
          headingFont: null,
          bodyFont: null,
          scriptFont: null,
          backgroundImageUrl: null,
        }),
      ),
    ).not.toThrow();
  });
});
