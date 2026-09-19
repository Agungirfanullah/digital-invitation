import { describe, expect, it } from "vitest";
import { GuestInvitationStatus } from "@prisma/client";

import {
  calculateResponseRate,
  normalizeConfirmedSeats,
  resolveAttendeeCount,
  resolveNextInvitationStatus,
} from "@/lib/rsvp/service";

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

describe("calculateResponseRate", () => {
  it("returns 0 when there are no guests yet, rather than dividing by zero", () => {
    expect(calculateResponseRate(0, 0)).toBe(0);
  });

  it("returns 0 when nobody has responded", () => {
    expect(calculateResponseRate(0, 10)).toBe(0);
  });

  it("returns 100 when everyone has responded", () => {
    expect(calculateResponseRate(10, 10)).toBe(100);
  });

  it("rounds to the nearest whole percent", () => {
    expect(calculateResponseRate(1, 3)).toBe(33);
    expect(calculateResponseRate(2, 3)).toBe(67);
  });
});

describe("normalizeConfirmedSeats", () => {
  it("passes through a normal non-negative sum", () => {
    expect(normalizeConfirmedSeats(5)).toBe(5);
  });

  it("treats null (no ATTENDING rows yet) as 0", () => {
    expect(normalizeConfirmedSeats(null)).toBe(0);
  });

  it("floors an impossible negative sum at 0 rather than displaying it", () => {
    expect(normalizeConfirmedSeats(-3)).toBe(0);
  });
});
