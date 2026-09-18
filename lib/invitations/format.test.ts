import { describe, expect, it } from "vitest";

import { formatIndonesianDate, formatTimeRange } from "@/lib/invitations/format";

describe("formatIndonesianDate", () => {
  it("formats an ISO date as a long Indonesian date", () => {
    expect(formatIndonesianDate("2026-12-12")).toBe("12 Desember 2026");
  });

  it("does not shift the day due to timezone conversion", () => {
    expect(formatIndonesianDate("2026-01-01")).toBe("1 Januari 2026");
  });
});

describe("formatTimeRange", () => {
  it("formats a start/end range", () => {
    expect(formatTimeRange("08:00", "10:00")).toBe("08:00 - 10:00");
  });

  it("collapses to a single time when start equals end", () => {
    expect(formatTimeRange("08:00", "08:00")).toBe("08:00");
  });

  it("does not append an assumed timezone label", () => {
    expect(formatTimeRange("08:00", "10:00")).not.toMatch(/WIB|WITA|WIT/);
  });
});
