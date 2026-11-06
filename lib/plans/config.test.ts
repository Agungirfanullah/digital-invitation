import { afterEach, describe, expect, it, vi } from "vitest";

import { parseEnforcementStart, parsePlanConfig } from "@/lib/plans/config";

describe("parsePlanConfig", () => {
  it("reads known features and limits", () => {
    const config = parsePlanConfig(
      { qrCheckIn: true, analytics: false, gift: true },
      { maxGuests: 50, maxGalleryPhotos: 6, activeDaysAfterEvent: 7, maxEvents: 1 },
    );
    expect(config.features.qrCheckIn).toBe(true);
    expect(config.features.analytics).toBe(false);
    expect(config.features.gift).toBe(true);
    expect(config.limits).toEqual({
      maxEvents: 1,
      maxGuests: 50,
      maxGalleryPhotos: 6,
      activeDaysAfterEvent: 7,
    });
  });

  it("turns a missing or non-true feature off", () => {
    const config = parsePlanConfig({ analytics: "yes", gift: 1 }, {});
    expect(config.features.analytics).toBe(false);
    expect(config.features.gift).toBe(false);
    expect(config.features.musicUpload).toBe(false);
  });

  it("treats a missing or invalid limit as no limit and floors fractions", () => {
    const config = parsePlanConfig(
      {},
      { maxGuests: -5, maxGalleryPhotos: "10", activeDaysAfterEvent: 7.9 },
    );
    expect(config.limits.maxGuests).toBeNull();
    expect(config.limits.maxGalleryPhotos).toBeNull();
    expect(config.limits.maxEvents).toBeNull();
    expect(config.limits.activeDaysAfterEvent).toBe(7);
  });

  it("survives JSON that is not an object", () => {
    const config = parsePlanConfig(null, ["maxGuests"]);
    expect(config.features.qrCheckIn).toBe(false);
    expect(config.limits.maxGuests).toBeNull();
  });
});

describe("parseEnforcementStart", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is off when unset or blank", () => {
    expect(parseEnforcementStart(undefined)).toBeNull();
    expect(parseEnforcementStart("  ")).toBeNull();
  });

  it("reads an ISO date or date-time", () => {
    expect(parseEnforcementStart("2026-12-01T00:00:00+07:00")?.toISOString()).toBe(
      "2026-11-30T17:00:00.000Z",
    );
    expect(parseEnforcementStart("2026-12-01")?.toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });

  it("reports an invalid value and stays off", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(parseEnforcementStart("besok")).toBeNull();
    expect(error).toHaveBeenCalledOnce();
  });
});
