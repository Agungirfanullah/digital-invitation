import { describe, expect, it } from "vitest";

import { onboardingSchema } from "@/lib/onboarding/validation";

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    type: "WEDDING",
    title: "Pernikahan Raka & Nadia",
    date: "2026-12-12",
    identity: { family: "COUPLE", firstName: "Raka", secondName: "Nadia" },
    templateSlug: "minimal-elegant",
    ...overrides,
  };
}

describe("onboardingSchema", () => {
  it("accepts a valid COUPLE submission", () => {
    expect(onboardingSchema.safeParse(validInput()).success).toBe(true);
  });

  it("accepts a valid GENERIC (OTHER) submission with no identity fields", () => {
    const result = onboardingSchema.safeParse(
      validInput({ type: "OTHER", identity: { family: "GENERIC" } }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a title shorter than 3 characters", () => {
    const result = onboardingSchema.safeParse(validInput({ title: "AB" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid event type", () => {
    const result = onboardingSchema.safeParse(validInput({ type: "NOT_A_TYPE" }));
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const result = onboardingSchema.safeParse(validInput({ date: "12/12/2026" }));
    expect(result.success).toBe(false);
  });

  it("rejects a COUPLE identity missing the second name", () => {
    const result = onboardingSchema.safeParse(
      validInput({ identity: { family: "COUPLE", firstName: "Raka", secondName: "" } }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a PERSON identity missing the name", () => {
    const result = onboardingSchema.safeParse(
      validInput({ type: "BIRTHDAY", identity: { family: "PERSON", name: "" } }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an empty templateSlug", () => {
    const result = onboardingSchema.safeParse(validInput({ templateSlug: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects an unknown identity family", () => {
    const result = onboardingSchema.safeParse(validInput({ identity: { family: "ALIEN" } }));
    expect(result.success).toBe(false);
  });
});
