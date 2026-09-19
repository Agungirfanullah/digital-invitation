import { describe, expect, it } from "vitest";

import { generateGuestToken } from "@/lib/guests/token";
import { guestTokenSchema } from "@/lib/invitations/token";

describe("generateGuestToken", () => {
  it("produces a token accepted by the public resolver's format check", () => {
    expect(guestTokenSchema.safeParse(generateGuestToken()).success).toBe(true);
  });

  it("never repeats across many calls (collision probability check)", () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => generateGuestToken()));
    expect(tokens.size).toBe(1000);
  });

  it("only uses URL-safe characters", () => {
    expect(generateGuestToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
