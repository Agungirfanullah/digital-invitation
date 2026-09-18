import { describe, expect, it } from "vitest";

import { createEventSchema, slugSchema } from "@/lib/events/validation";

describe("createEventSchema", () => {
  const valid = {
    title: "Pernikahan Raka & Nadia",
    type: "WEDDING",
    slug: "raka-dan-nadia",
    description: "Undangan pernikahan kami.",
  };

  it("accepts valid input", () => {
    expect(createEventSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a missing/empty description", () => {
    expect(createEventSchema.safeParse({ ...valid, description: undefined }).success).toBe(true);
    expect(createEventSchema.safeParse({ ...valid, description: "" }).success).toBe(true);
  });

  it("rejects a title shorter than 3 characters", () => {
    expect(createEventSchema.safeParse({ ...valid, title: "Ab" }).success).toBe(false);
  });

  it("rejects an unknown event type", () => {
    expect(createEventSchema.safeParse({ ...valid, type: "NOT_A_TYPE" }).success).toBe(false);
  });

  it("rejects a description longer than 500 characters", () => {
    const result = createEventSchema.safeParse({ ...valid, description: "a".repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe("slugSchema", () => {
  it("accepts a lowercase, hyphenated slug", () => {
    expect(slugSchema.safeParse("raka-dan-nadia").success).toBe(true);
  });

  it("normalizes uppercase characters to lowercase rather than rejecting them", () => {
    const result = slugSchema.safeParse("Raka-Nadia");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("raka-nadia");
  });

  it("rejects spaces", () => {
    expect(slugSchema.safeParse("raka nadia").success).toBe(false);
  });

  it("rejects a leading or trailing hyphen", () => {
    expect(slugSchema.safeParse("-raka-nadia").success).toBe(false);
    expect(slugSchema.safeParse("raka-nadia-").success).toBe(false);
  });

  it("rejects a slug shorter than 3 characters", () => {
    expect(slugSchema.safeParse("ab").success).toBe(false);
  });

  it("rejects underscores and other special characters", () => {
    expect(slugSchema.safeParse("raka_nadia").success).toBe(false);
    expect(slugSchema.safeParse("raka.nadia").success).toBe(false);
  });
});
