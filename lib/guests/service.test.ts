import { describe, expect, it } from "vitest";
import { GuestInvitationStatus } from "@prisma/client";

import { resolveInvitationAfterRegeneration } from "@/lib/guests/service";

describe("resolveInvitationAfterRegeneration", () => {
  it("resets NOT_SENT to NOT_SENT and clears timestamps (no-op status, but confirms the reset path)", () => {
    expect(resolveInvitationAfterRegeneration(GuestInvitationStatus.NOT_SENT)).toEqual({
      status: GuestInvitationStatus.NOT_SENT,
      resetTimestamps: true,
    });
  });

  it("resets SENT back to NOT_SENT — the previously-sent link no longer exists", () => {
    expect(resolveInvitationAfterRegeneration(GuestInvitationStatus.SENT)).toEqual({
      status: GuestInvitationStatus.NOT_SENT,
      resetTimestamps: true,
    });
  });

  it("resets OPENED back to NOT_SENT", () => {
    expect(resolveInvitationAfterRegeneration(GuestInvitationStatus.OPENED)).toEqual({
      status: GuestInvitationStatus.NOT_SENT,
      resetTimestamps: true,
    });
  });

  it("preserves RSVPED — the guest's own action doesn't depend on which token they used", () => {
    expect(resolveInvitationAfterRegeneration(GuestInvitationStatus.RSVPED)).toEqual({
      status: GuestInvitationStatus.RSVPED,
      resetTimestamps: false,
    });
  });

  it("preserves CHECKED_IN", () => {
    expect(resolveInvitationAfterRegeneration(GuestInvitationStatus.CHECKED_IN)).toEqual({
      status: GuestInvitationStatus.CHECKED_IN,
      resetTimestamps: false,
    });
  });
});
