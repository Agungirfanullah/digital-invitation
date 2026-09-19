import { describe, expect, it } from "vitest";

import { normalizeGuestName, phoneDigits } from "@/lib/guests/normalize";

describe("normalizeGuestName", () => {
  it("lowercases and trims", () => {
    expect(normalizeGuestName("  Budi Santoso  ")).toBe("budi santoso");
  });

  it("collapses repeated internal whitespace", () => {
    expect(normalizeGuestName("Budi   Santoso")).toBe("budi santoso");
  });

  it("does not strip diacritics — names are matched as typed", () => {
    expect(normalizeGuestName("Renée")).toBe("renée");
  });
});

describe("phoneDigits", () => {
  it("strips formatting characters", () => {
    expect(phoneDigits("0812-3456-7890")).toBe("6281234567890");
  });

  it("treats a leading 0 as equivalent to the 62 country code", () => {
    expect(phoneDigits("081234567890")).toBe(phoneDigits("+6281234567890"));
  });

  it("strips spaces and parentheses", () => {
    expect(phoneDigits("+62 (812) 3456 7890")).toBe("6281234567890");
  });
});
