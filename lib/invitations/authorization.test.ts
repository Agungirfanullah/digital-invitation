import { describe, expect, it } from "vitest";

import { isEventPubliclyVisible } from "@/lib/invitations/authorization";

describe("isEventPubliclyVisible", () => {
  it("is visible when PUBLISHED with no expiry", () => {
    expect(isEventPubliclyVisible({ status: "PUBLISHED", expiresAt: null })).toBe(true);
  });

  it("is visible when PUBLISHED with a future expiry", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60);
    expect(isEventPubliclyVisible({ status: "PUBLISHED", expiresAt: future })).toBe(true);
  });

  it("is not visible when PUBLISHED but expired", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60);
    expect(isEventPubliclyVisible({ status: "PUBLISHED", expiresAt: past })).toBe(false);
  });

  it("is not visible when DRAFT", () => {
    expect(isEventPubliclyVisible({ status: "DRAFT", expiresAt: null })).toBe(false);
  });

  it("is not visible when ARCHIVED", () => {
    expect(isEventPubliclyVisible({ status: "ARCHIVED", expiresAt: null })).toBe(false);
  });
});
