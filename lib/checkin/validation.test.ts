import { describe, expect, it } from "vitest";

import {
  checkInSearchQuerySchema,
  manualCheckInSchema,
  qrCheckInSchema,
} from "@/lib/checkin/validation";

describe("qrCheckInSchema", () => {
  it("accepts a non-empty scanned value and trims whitespace", () => {
    const result = qrCheckInSchema.parse({ scannedValue: "  https://example.com/?to=abc  " });
    expect(result).toEqual({ scannedValue: "https://example.com/?to=abc" });
  });

  it("rejects an empty scanned value", () => {
    expect(qrCheckInSchema.safeParse({ scannedValue: "" }).success).toBe(false);
    expect(qrCheckInSchema.safeParse({ scannedValue: "   " }).success).toBe(false);
  });

  it("rejects a scanned value over 2000 characters", () => {
    expect(qrCheckInSchema.safeParse({ scannedValue: "a".repeat(2001) }).success).toBe(false);
  });

  it("rejects a missing field", () => {
    expect(qrCheckInSchema.safeParse({}).success).toBe(false);
  });
});

describe("manualCheckInSchema", () => {
  it("accepts a non-empty guestId", () => {
    expect(manualCheckInSchema.parse({ guestId: "guest_123" })).toEqual({ guestId: "guest_123" });
  });

  it("rejects an empty guestId", () => {
    expect(manualCheckInSchema.safeParse({ guestId: "" }).success).toBe(false);
    expect(manualCheckInSchema.safeParse({ guestId: "   " }).success).toBe(false);
  });
});

describe("checkInSearchQuerySchema", () => {
  it("accepts a non-empty query", () => {
    expect(checkInSearchQuerySchema.parse({ q: "Ayu" })).toEqual({ q: "Ayu" });
  });

  it("rejects an empty query", () => {
    expect(checkInSearchQuerySchema.safeParse({ q: "" }).success).toBe(false);
  });

  it("rejects a query over 100 characters", () => {
    expect(checkInSearchQuerySchema.safeParse({ q: "a".repeat(101) }).success).toBe(false);
  });
});
