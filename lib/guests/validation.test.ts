import { describe, expect, it } from "vitest";

import { guestCsvRowSchema, guestInputSchema, guestListQuerySchema } from "@/lib/guests/validation";

describe("guestInputSchema", () => {
  const valid = {
    name: "Budi Santoso",
    phone: "0812-3456-7890",
    email: "budi@example.com",
    category: "FAMILY",
    seatQuota: 2,
    notes: null,
  };

  it("accepts valid input", () => {
    expect(guestInputSchema.safeParse(valid).success).toBe(true);
  });

  it("treats an empty string as null for optional fields (FormData shape)", () => {
    const result = guestInputSchema.safeParse({ ...valid, phone: "", email: "", notes: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeNull();
      expect(result.data.email).toBeNull();
      expect(result.data.notes).toBeNull();
    }
  });

  it("rejects a name shorter than 2 characters", () => {
    expect(guestInputSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(guestInputSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a malformed phone number", () => {
    expect(guestInputSchema.safeParse({ ...valid, phone: "call me maybe" }).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(guestInputSchema.safeParse({ ...valid, category: "ENEMY" }).success).toBe(false);
  });

  it("rejects a seat quota of 0", () => {
    expect(guestInputSchema.safeParse({ ...valid, seatQuota: 0 }).success).toBe(false);
  });

  it("rejects a seat quota above 20", () => {
    expect(guestInputSchema.safeParse({ ...valid, seatQuota: 21 }).success).toBe(false);
  });

  it("coerces a string seat quota (FormData sends strings)", () => {
    const result = guestInputSchema.safeParse({ ...valid, seatQuota: "3" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.seatQuota).toBe(3);
  });
});

describe("guestListQuerySchema", () => {
  it("defaults category to ALL, sort to newest, page to 1", () => {
    const result = guestListQuerySchema.parse({});
    expect(result.category).toBe("ALL");
    expect(result.sort).toBe("newest");
    expect(result.page).toBe(1);
  });

  it("falls back to safe defaults for garbage query-string values rather than erroring", () => {
    const result = guestListQuerySchema.parse({
      category: "not-a-category",
      sort: "??",
      page: "abc",
    });
    expect(result.category).toBe("ALL");
    expect(result.sort).toBe("newest");
    expect(result.page).toBe(1);
  });

  it("accepts a valid category/sort/page combination", () => {
    const result = guestListQuerySchema.parse({ category: "VIP", sort: "name_asc", page: "2" });
    expect(result.category).toBe("VIP");
    expect(result.sort).toBe("name_asc");
    expect(result.page).toBe(2);
  });
});

describe("guestCsvRowSchema", () => {
  it("defaults category to OTHER and seatQuota to 1 when blank", () => {
    const result = guestCsvRowSchema.safeParse({
      name: "Citra Wulandari",
      phone: null,
      email: null,
      category: null,
      seatQuota: null,
      notes: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("OTHER");
      expect(result.data.seatQuota).toBe(1);
    }
  });

  it("rejects a row with no name", () => {
    const result = guestCsvRowSchema.safeParse({
      name: "",
      phone: null,
      email: null,
      category: null,
      seatQuota: null,
      notes: null,
    });
    expect(result.success).toBe(false);
  });
});
