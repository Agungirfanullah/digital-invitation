import { describe, expect, it } from "vitest";

import { resolveFontStack } from "@/lib/invitations/font-stack";
import { TEMPLATE_DEFAULT_THEMES } from "@/lib/invitations/templates/default-themes";

describe("resolveFontStack", () => {
  it("points a known web font at its self-hosted variable, keeping the name as fallback", () => {
    expect(resolveFontStack("'Playfair Display', Georgia, serif")).toBe(
      "var(--font-playfair-display, 'Playfair Display'), Georgia, serif",
    );
  });

  it("leaves system fonts and unknown families untouched", () => {
    const stack = "'Helvetica Neue', Arial, sans-serif";
    expect(resolveFontStack(stack)).toBe(stack);
    expect(resolveFontStack("'Brush Script MT', cursive")).toBe("'Brush Script MT', cursive");
  });

  it("covers the first family of every template's heading and script fonts", () => {
    for (const [slug, theme] of Object.entries(TEMPLATE_DEFAULT_THEMES)) {
      for (const stack of [theme.headingFont, theme.scriptFont]) {
        const first = stack.split(",")[0].trim();
        const isWebFont =
          first.startsWith("'") && !/Brush Script|Helvetica|Times|Courier|Arial/.test(first);
        if (isWebFont) {
          expect(resolveFontStack(stack), `${slug}: ${first}`).toMatch(/^var\(--font-/);
        }
      }
    }
  });
});
