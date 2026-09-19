import { describe, expect, it } from "vitest";
import { GuestInvitationStatus } from "@prisma/client";

import { resolveAttendeeCount, resolveNextInvitationStatus } from "@/lib/rsvp/service";

describe("resolveAttendeeCount", () => {
  it("keeps the submitted count when attending", () => {
    expect(resolveAttendeeCount("ATTENDING", 3)).toBe(3);
  });

  it("forces the count to 0 when not attending, regardless of what was submitted", () => {
    expect(resolveAttendeeCount("NOT_ATTENDING", 5)).toBe(0);
  });

  it("forces the count to 0 when maybe, regardless of what was submitted", () => {
    expect(resolveAttendeeCount("MAYBE", 5)).toBe(0);
  });
});

describe("resolveNextInvitationStatus", () => {
  it("advances NOT_SENT to RSVPED", () => {
    expect(resolveNextInvitationStatus(GuestInvitationStatus.NOT_SENT)).toBe(
      GuestInvitationStatus.RSVPED,
    );
  });

  it("advances SENT to RSVPED", () => {
    expect(resolveNextInvitationStatus(GuestInvitationStatus.SENT)).toBe(
      GuestInvitationStatus.RSVPED,
    );
  });

  it("advances OPENED to RSVPED", () => {
    expect(resolveNextInvitationStatus(GuestInvitationStatus.OPENED)).toBe(
      GuestInvitationStatus.RSVPED,
    );
  });

  it("keeps RSVPED as RSVPED on a repeat submission", () => {
    expect(resolveNextInvitationStatus(GuestInvitationStatus.RSVPED)).toBe(
      GuestInvitationStatus.RSVPED,
    );
  });

  it("never downgrades CHECKED_IN back to RSVPED", () => {
    expect(resolveNextInvitationStatus(GuestInvitationStatus.CHECKED_IN)).toBe(
      GuestInvitationStatus.CHECKED_IN,
    );
  });
});
