import { describe, expect, it } from "vitest";

import { calculateCheckInProgress } from "@/lib/analytics/service";

describe("calculateCheckInProgress", () => {
  it("returns 0 when there are no confirmed guests (never divides by zero)", () => {
    expect(calculateCheckInProgress(0, 0)).toBe(0);
    expect(calculateCheckInProgress(5, 0)).toBe(0);
  });

  it("computes a normal rounded percentage", () => {
    expect(calculateCheckInProgress(1, 3)).toBe(33);
    expect(calculateCheckInProgress(2, 4)).toBe(50);
  });

  it("reaches exactly 100 when everyone confirmed has checked in", () => {
    expect(calculateCheckInProgress(4, 4)).toBe(100);
  });

  it("clamps at 100 when checkedIn exceeds confirmed (walk-ins are allowed — RSVP never gates check-in)", () => {
    expect(calculateCheckInProgress(10, 4)).toBe(100);
  });

  it("never returns a negative value", () => {
    expect(calculateCheckInProgress(0, 5)).toBe(0);
  });
});
