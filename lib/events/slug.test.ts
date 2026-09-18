import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/events/slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Pernikahan Raka & Nadia")).toBe("pernikahan-raka-nadia");
  });

  it("strips diacritics", () => {
    expect(slugify("Ulang Tahun Ke-25 José")).toBe("ulang-tahun-ke-25-jose");
  });

  it("collapses repeated separators and trims leading/trailing hyphens", () => {
    expect(slugify("  --Hello   World--  ")).toBe("hello-world");
  });

  it("truncates to 60 characters without leaving a trailing hyphen", () => {
    const long = "a".repeat(58) + " b c d e";
    const result = slugify(long);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.endsWith("-")).toBe(false);
  });

  it("returns an empty string for input with no valid characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
