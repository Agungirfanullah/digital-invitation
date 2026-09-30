import { describe, expect, it } from "vitest";

import { resolveOpeningEnabled } from "@/lib/invitations/opening";

describe("resolveOpeningEnabled (D-069)", () => {
  it("defaults to enabled when settings is null/undefined/empty — new events and events that predate the feature", () => {
    expect(resolveOpeningEnabled(null)).toBe(true);
    expect(resolveOpeningEnabled(undefined)).toBe(true);
    expect(resolveOpeningEnabled({})).toBe(true);
  });

  it("defaults to enabled when the key is absent alongside unrelated settings", () => {
    expect(resolveOpeningEnabled({ sections: { rsvp: false } })).toBe(true);
  });

  it("respects an explicit false override", () => {
    expect(resolveOpeningEnabled({ openingEnabled: false })).toBe(false);
  });

  it("respects an explicit true override", () => {
    expect(resolveOpeningEnabled({ openingEnabled: true })).toBe(true);
  });

  it("fails safe to enabled on malformed settings", () => {
    for (const settings of ["x", 42, [], { openingEnabled: "false" }, { openingEnabled: null }]) {
      expect(resolveOpeningEnabled(settings)).toBe(true);
    }
  });
});
