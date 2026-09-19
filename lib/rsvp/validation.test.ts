import { describe, expect, it } from "vitest";

import { rsvpDashboardQuerySchema, rsvpFormSchema, rsvpTokenSchema } from "@/lib/rsvp/validation";

describe("rsvpFormSchema", () => {
  it("accepts a valid ATTENDING answer", () => {
    const result = rsvpFormSchema.safeParse({
      attendance: "ATTENDING",
      attendeeCount: 2,
      message: "Sampai jumpa!",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid NOT_ATTENDING answer with no attendee count", () => {
    const result = rsvpFormSchema.safeParse({
      attendance: "NOT_ATTENDING",
      attendeeCount: 0,
      message: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid MAYBE answer", () => {
    const result = rsvpFormSchema.safeParse({
      attendance: "MAYBE",
      attendeeCount: 0,
      message: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects ATTENDING with an attendee count of 0", () => {
    const result = rsvpFormSchema.safeParse({
      attendance: "ATTENDING",
      attendeeCount: 0,
      message: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown attendance value", () => {
    const result = rsvpFormSchema.safeParse({
      attendance: "SORT_OF",
      attendeeCount: 1,
      message: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a message exceeding 500 characters", () => {
    const result = rsvpFormSchema.safeParse({
      attendance: "MAYBE",
      attendeeCount: 0,
      message: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("treats an empty message string as null", () => {
    const result = rsvpFormSchema.safeParse({
      attendance: "MAYBE",
      attendeeCount: 0,
      message: "",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.message).toBeNull();
  });

  it("coerces a string attendeeCount (FormData sends strings)", () => {
    const result = rsvpFormSchema.safeParse({
      attendance: "ATTENDING",
      attendeeCount: "3",
      message: null,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.attendeeCount).toBe(3);
  });

  it("rejects an absurdly large attendee count", () => {
    const result = rsvpFormSchema.safeParse({
      attendance: "ATTENDING",
      attendeeCount: 9999,
      message: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("rsvpTokenSchema", () => {
  it("accepts a well-formed token", () => {
    expect(rsvpTokenSchema.safeParse("aB3-_9xyzABCDEF").success).toBe(true);
  });

  it("rejects a too-short token", () => {
    expect(rsvpTokenSchema.safeParse("short").success).toBe(false);
  });

  it("rejects a token with disallowed characters", () => {
    expect(rsvpTokenSchema.safeParse("has spaces or slash/here").success).toBe(false);
  });
});

describe("rsvpDashboardQuerySchema", () => {
  it("defaults page to 1, status/category to ALL, sort to name_asc", () => {
    const result = rsvpDashboardQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.status).toBe("ALL");
    expect(result.category).toBe("ALL");
    expect(result.sort).toBe("name_asc");
    expect(result.q).toBeUndefined();
  });

  it("falls back to page 1 for a garbage value rather than erroring", () => {
    expect(rsvpDashboardQuerySchema.parse({ page: "not-a-number" }).page).toBe(1);
  });

  it("accepts a valid page number", () => {
    expect(rsvpDashboardQuerySchema.parse({ page: "3" }).page).toBe(3);
  });

  it("accepts every real RSVP attendance value as a status filter", () => {
    expect(rsvpDashboardQuerySchema.parse({ status: "ATTENDING" }).status).toBe("ATTENDING");
    expect(rsvpDashboardQuerySchema.parse({ status: "NOT_ATTENDING" }).status).toBe(
      "NOT_ATTENDING",
    );
    expect(rsvpDashboardQuerySchema.parse({ status: "MAYBE" }).status).toBe("MAYBE");
  });

  it("accepts the PENDING (no response yet) status filter", () => {
    expect(rsvpDashboardQuerySchema.parse({ status: "PENDING" }).status).toBe("PENDING");
  });

  it("falls back to ALL for an unknown status value rather than erroring", () => {
    expect(rsvpDashboardQuerySchema.parse({ status: "SOMETHING_ELSE" }).status).toBe("ALL");
  });

  it("falls back to ALL for an unknown category value rather than erroring", () => {
    expect(rsvpDashboardQuerySchema.parse({ category: "NOT_A_CATEGORY" }).category).toBe("ALL");
  });

  it("accepts a valid category filter", () => {
    expect(rsvpDashboardQuerySchema.parse({ category: "VIP" }).category).toBe("VIP");
  });

  it("accepts a search term and trims it", () => {
    expect(rsvpDashboardQuerySchema.parse({ q: "  Ayu  " }).q).toBe("Ayu");
  });

  it("treats an empty search term as no filter", () => {
    expect(rsvpDashboardQuerySchema.parse({ q: "" }).q).toBeUndefined();
  });

  it("falls back to name_asc for an unknown sort value rather than erroring", () => {
    expect(rsvpDashboardQuerySchema.parse({ sort: "submitted_desc" }).sort).toBe("name_asc");
  });

  it("accepts name_desc", () => {
    expect(rsvpDashboardQuerySchema.parse({ sort: "name_desc" }).sort).toBe("name_desc");
  });
});
