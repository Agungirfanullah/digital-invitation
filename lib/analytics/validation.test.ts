import { describe, expect, it } from "vitest";

import { trackInvitationViewSchema } from "@/lib/analytics/validation";

const VALID_SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("trackInvitationViewSchema", () => {
  it("accepts a fully valid input", () => {
    const result = trackInvitationViewSchema.safeParse({
      eventId: "evt_123",
      guestId: "guest_123",
      sessionId: VALID_SESSION_ID,
      deviceType: "MOBILE",
      referrer: "https://wa.me",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null guestId and null referrer", () => {
    const result = trackInvitationViewSchema.safeParse({
      eventId: "evt_123",
      guestId: null,
      sessionId: VALID_SESSION_ID,
      deviceType: "DESKTOP",
      referrer: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed sessionId", () => {
    const result = trackInvitationViewSchema.safeParse({
      eventId: "evt_123",
      guestId: null,
      sessionId: "not-a-uuid",
      deviceType: "DESKTOP",
      referrer: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty eventId", () => {
    const result = trackInvitationViewSchema.safeParse({
      eventId: "",
      guestId: null,
      sessionId: VALID_SESSION_ID,
      deviceType: "DESKTOP",
      referrer: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized eventId (unbounded string guard)", () => {
    const result = trackInvitationViewSchema.safeParse({
      eventId: "a".repeat(65),
      guestId: null,
      sessionId: VALID_SESSION_ID,
      deviceType: "DESKTOP",
      referrer: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized referrer", () => {
    const result = trackInvitationViewSchema.safeParse({
      eventId: "evt_123",
      guestId: null,
      sessionId: VALID_SESSION_ID,
      deviceType: "DESKTOP",
      referrer: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown deviceType value", () => {
    const result = trackInvitationViewSchema.safeParse({
      eventId: "evt_123",
      guestId: null,
      sessionId: VALID_SESSION_ID,
      deviceType: "SMART_FRIDGE",
      referrer: null,
    });
    expect(result.success).toBe(false);
  });
});
