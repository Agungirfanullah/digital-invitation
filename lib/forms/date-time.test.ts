import { describe, expect, it } from "vitest";

import {
  buildTimeSlots,
  isSlotUnavailable,
  parseIsoDate,
  pickInitialSlot,
  toIsoDate,
} from "@/lib/forms/date-time";

describe("parseIsoDate / toIsoDate", () => {
  it("round-trips a date without shifting the day, whatever the machine's timezone", () => {
    for (const iso of ["2026-12-12", "2026-01-01", "2026-12-31", "2028-02-29", "2026-03-29"]) {
      const date = parseIsoDate(iso);
      expect(date).not.toBeNull();
      expect(toIsoDate(date as Date)).toBe(iso);
    }
  });

  it("builds a local-midnight date with the right year, month and day", () => {
    const date = parseIsoDate("2026-12-12") as Date;
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 11, 12]);
    expect([date.getHours(), date.getMinutes()]).toEqual([0, 0]);
  });

  it("rejects anything that is not a real calendar date", () => {
    for (const bad of [
      "",
      "2026-02-30",
      "2026-13-01",
      "2026-00-10",
      "2027-02-29",
      "12/12/2026",
      "2026-1-1",
      "abc",
    ]) {
      expect(parseIsoDate(bad), bad).toBeNull();
    }
    expect(parseIsoDate(null)).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
  });
});

describe("buildTimeSlots", () => {
  it("covers the whole day in 15-minute steps", () => {
    const slots = buildTimeSlots();
    expect(slots).toHaveLength(96);
    expect(slots[0]).toBe("00:00");
    expect(slots[1]).toBe("00:15");
    expect(slots[36]).toBe("09:00");
    expect(slots[95]).toBe("23:45");
  });

  it("only produces values the server's HH:mm rule accepts", () => {
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
    expect(buildTimeSlots().every((slot) => hhmm.test(slot))).toBe(true);
    expect(buildTimeSlots(30)).toHaveLength(48);
  });
});

describe("isSlotUnavailable", () => {
  it("is never true without a minimum", () => {
    expect(isSlotUnavailable("00:00", null)).toBe(false);
    expect(isSlotUnavailable("00:00", "")).toBe(false);
    expect(isSlotUnavailable("00:00", undefined)).toBe(false);
  });

  it("blocks the minimum itself and everything before it (end must be after start)", () => {
    expect(isSlotUnavailable("08:45", "09:00")).toBe(true);
    expect(isSlotUnavailable("09:00", "09:00")).toBe(true);
    expect(isSlotUnavailable("09:15", "09:00")).toBe(false);
  });
});

describe("pickInitialSlot", () => {
  const slots = buildTimeSlots();

  it("uses the current value when it is an available slot", () => {
    expect(pickInitialSlot(slots, "10:30", null)).toBe("10:30");
  });

  it("moves an off-grid value to the next available slot", () => {
    expect(pickInitialSlot(slots, "08:07", null)).toBe("08:15");
  });

  it("falls back to the first available slot when empty", () => {
    expect(pickInitialSlot(slots, "", null)).toBe("00:00");
    expect(pickInitialSlot(slots, "", "09:00")).toBe("09:15");
  });

  it("skips slots that the minimum rules out", () => {
    expect(pickInitialSlot(slots, "08:00", "09:00")).toBe("09:15");
  });

  it("returns null when nothing is available", () => {
    expect(pickInitialSlot(slots, "23:45", "23:45")).toBeNull();
  });
});
