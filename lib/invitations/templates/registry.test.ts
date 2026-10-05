import { describe, expect, it } from "vitest";

import { isKnownTemplateKey, resolveTemplateComponent } from "@/lib/invitations/templates/registry";

const SEEDED_SLUGS = [
  "minimal-elegant",
  "modern-editorial",
  "floral-romance",
  "dark-luxury",
  "traditional-nusantara",
  "soft-romantic",
  "cinematic-journey",
  "rustic-earth",
  "playful-pop",
  "royal-gold",
  "blue-bloom",
  "mono-frame",
  "garden-tropical",
  "art-deco",
  "vintage-sepia",
  "industrial-loft",
];

describe("template registry", () => {
  it("resolves a known template key to its component", () => {
    expect(isKnownTemplateKey("minimal-elegant")).toBe(true);
    expect(resolveTemplateComponent("minimal-elegant")).toBeTypeOf("function");
  });

  it("safely falls back to the default template for an unknown key", () => {
    expect(isKnownTemplateKey("some-template-that-does-not-exist")).toBe(false);
    expect(() => resolveTemplateComponent("some-template-that-does-not-exist")).not.toThrow();
  });

  it("safely falls back to the default template for a null key", () => {
    expect(isKnownTemplateKey(null)).toBe(false);
    expect(() => resolveTemplateComponent(null)).not.toThrow();
  });

  it("falls back to the same component for null and unknown keys", () => {
    expect(resolveTemplateComponent(null)).toBe(resolveTemplateComponent("not-a-real-template"));
  });

  it("does not cause a runtime failure for every seeded template slug (see prisma/seed.ts)", () => {
    for (const slug of SEEDED_SLUGS) {
      expect(() => resolveTemplateComponent(slug)).not.toThrow();
    }
  });

  it("every seeded template slug is genuinely registered (Phase 3 — no more silent fallback)", () => {
    for (const slug of SEEDED_SLUGS) {
      expect(isKnownTemplateKey(slug)).toBe(true);
    }
  });

  it("resolves every seeded template slug to its own distinct component, not the fallback", () => {
    const resolved = SEEDED_SLUGS.map((slug) => resolveTemplateComponent(slug));
    expect(new Set(resolved).size).toBe(SEEDED_SLUGS.length);
  });
});
