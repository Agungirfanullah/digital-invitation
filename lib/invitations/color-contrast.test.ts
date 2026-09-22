import { describe, expect, it } from "vitest";

import {
  contrastRatio,
  relativeLuminance,
  resolveReadableForeground,
} from "@/lib/invitations/color-contrast";

describe("relativeLuminance", () => {
  it("returns 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("returns null for a non-hex color string", () => {
    expect(relativeLuminance("oklch(0.5 0 0)")).toBeNull();
    expect(relativeLuminance("rebeccapurple")).toBeNull();
  });

  it("accepts a hex color without a leading #", () => {
    expect(relativeLuminance("ffffff")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black vs white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("is 1 for a color against itself", () => {
    expect(contrastRatio("#7a5c3e", "#7a5c3e")).toBeCloseTo(1, 5);
  });

  it("is order-independent", () => {
    expect(contrastRatio("#111111", "#eeeeee")).toBeCloseTo(
      contrastRatio("#eeeeee", "#111111")!,
      5,
    );
  });

  it("returns null when either color is unparseable", () => {
    expect(contrastRatio("not-a-color", "#ffffff")).toBeNull();
  });
});

describe("resolveReadableForeground", () => {
  it("picks white text for a near-black background", () => {
    expect(resolveReadableForeground("#0a0a0a", "#000000")).toBe("#ffffff");
  });

  it("picks near-black text for a near-white background", () => {
    expect(resolveReadableForeground("#f5efe0", "#000000")).toBe("#0a0a0a");
  });

  it("falls back to the given fallback for an unparseable background", () => {
    expect(resolveReadableForeground("hsl(200 50% 50%)", "#123456")).toBe("#123456");
  });

  it("always returns a value that contrasts at least as well as the alternative", () => {
    const bg = "#808080"; // mid-gray — the genuinely ambiguous case
    const chosen = resolveReadableForeground(bg, "#000000");
    const contrastChosen = contrastRatio(bg, chosen)!;
    const contrastOther = contrastRatio(bg, chosen === "#ffffff" ? "#0a0a0a" : "#ffffff")!;
    expect(contrastChosen).toBeGreaterThanOrEqual(contrastOther);
  });
});
