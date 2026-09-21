import { describe, expect, it } from "vitest";

import {
  wishFormSchema,
  wishModerationQuerySchema,
  wishStatusFilterSchema,
} from "@/lib/wishes/validation";

describe("wishFormSchema", () => {
  it("accepts a valid name/message and trims whitespace", () => {
    const result = wishFormSchema.parse({ name: "  Ayu  ", message: "  Selamat menikah!  " });
    expect(result).toEqual({ name: "Ayu", message: "Selamat menikah!" });
  });

  it("rejects an empty name", () => {
    const result = wishFormSchema.safeParse({ name: "", message: "Selamat!" });
    expect(result.success).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    const result = wishFormSchema.safeParse({ name: "a".repeat(101), message: "Selamat!" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = wishFormSchema.safeParse({ name: "Ayu", message: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a message over 500 characters", () => {
    const result = wishFormSchema.safeParse({ name: "Ayu", message: "a".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts a message at exactly the 500 character limit", () => {
    const result = wishFormSchema.safeParse({ name: "Ayu", message: "a".repeat(500) });
    expect(result.success).toBe(true);
  });
});

describe("wishStatusFilterSchema", () => {
  it("accepts every WishStatus value and the ALL literal", () => {
    for (const value of ["PENDING", "APPROVED", "HIDDEN", "DELETED", "ALL"]) {
      expect(wishStatusFilterSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects an unknown status", () => {
    expect(wishStatusFilterSchema.safeParse("UNKNOWN").success).toBe(false);
  });
});

describe("wishModerationQuerySchema", () => {
  it("defaults status to ALL and page to 1 when omitted", () => {
    expect(wishModerationQuerySchema.parse({})).toEqual({ status: "ALL", page: 1 });
  });

  it("never errors on a malformed query — falls back to safe defaults", () => {
    const result = wishModerationQuerySchema.parse({
      status: "not-a-status",
      page: "not-a-number",
    });
    expect(result).toEqual({ status: "ALL", page: 1 });
  });

  it("coerces a numeric page string", () => {
    expect(wishModerationQuerySchema.parse({ page: "3" }).page).toBe(3);
  });

  it("falls back to page 1 for a non-positive page", () => {
    expect(wishModerationQuerySchema.parse({ page: "0" }).page).toBe(1);
  });
});
