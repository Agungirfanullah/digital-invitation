import { beforeEach, describe, expect, it, vi } from "vitest";

import { guestTokenSchema } from "@/lib/invitations/token";

describe("guestTokenSchema", () => {
  it("accepts a well-formed opaque token", () => {
    expect(guestTokenSchema.safeParse("abcDEF123-_token").success).toBe(true);
  });

  it("rejects a token that is too short", () => {
    expect(guestTokenSchema.safeParse("short").success).toBe(false);
  });

  it("rejects a token with disallowed characters", () => {
    expect(guestTokenSchema.safeParse("token with spaces!!").success).toBe(false);
    expect(guestTokenSchema.safeParse("token/with/slashes").success).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(guestTokenSchema.safeParse(12345).success).toBe(false);
    expect(guestTokenSchema.safeParse(undefined).success).toBe(false);
  });
});

const findUniqueMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    guestInvitation: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
    },
  },
}));

import { resolveGuestContext } from "@/lib/invitations/token";

describe("resolveGuestContext", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it("returns null for a malformed token without querying the database", async () => {
    const result = await resolveGuestContext("event-a", "bad token!!");
    expect(result).toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns the guest display name when the token belongs to the requested event", async () => {
    findUniqueMock.mockResolvedValue({ guest: { name: "Budi Santoso", eventId: "event-a" } });

    const result = await resolveGuestContext("event-a", "valid-token-1234567890");

    expect(result).toEqual({ displayName: "Budi Santoso" });
  });

  it("returns null when the token's guest belongs to a DIFFERENT event (cross-event protection)", async () => {
    findUniqueMock.mockResolvedValue({ guest: { name: "Budi Santoso", eventId: "event-b" } });

    const result = await resolveGuestContext("event-a", "valid-token-1234567890");

    expect(result).toBeNull();
  });

  it("returns null when the token does not resolve to any guest invitation", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await resolveGuestContext("event-a", "valid-token-1234567890");

    expect(result).toBeNull();
  });
});
