import { describe, expect, it } from "vitest";
import { EventType } from "@prisma/client";

import {
  findNonToggleableSections,
  INVITATION_SECTION_KEYS,
  mergeSectionOverrides,
  parseSectionOverrides,
  resolveEnabledSections,
  resolveSectionStates,
} from "@/lib/event-types/sections";

const ALL_TYPES = Object.values(EventType);

describe("resolveSectionStates — defaults", () => {
  it("every section is Supported, Default Enabled and Owner Toggleable for every type (PRD §15.1), except identity for OTHER", () => {
    for (const type of ALL_TYPES) {
      const states = resolveSectionStates(type, null);
      for (const key of INVITATION_SECTION_KEYS) {
        const expectedSupported = !(type === "OTHER" && key === "identity");
        expect(states[key]).toEqual({
          supported: expectedSupported,
          defaultEnabled: expectedSupported,
          toggleable: expectedSupported,
          enabled: expectedSupported,
        });
      }
    }
  });

  it("is deterministic: the same type and settings always resolve identically", () => {
    expect(resolveEnabledSections("CORPORATE", null)).toEqual(
      resolveEnabledSections("CORPORATE", undefined),
    );
  });
});

describe("resolveSectionStates — owner overrides", () => {
  it("applies an owner toggle", () => {
    const enabled = resolveEnabledSections("WEDDING", { sections: { rsvp: false, gift: false } });
    expect(enabled.rsvp).toBe(false);
    expect(enabled.gift).toBe(false);
    expect(enabled.wishes).toBe(true);
  });

  it("never lets an override enable an unsupported section", () => {
    expect(resolveEnabledSections("OTHER", { sections: { identity: true } }).identity).toBe(false);
  });

  it("fails safe on malformed settings", () => {
    const defaults = resolveEnabledSections("WEDDING", null);
    for (const settings of [
      "x",
      42,
      [],
      { sections: null },
      { sections: [] },
      { sections: { rsvp: "false" } },
      { sections: { notASection: false } },
    ]) {
      expect(resolveEnabledSections("WEDDING", settings)).toEqual(defaults);
    }
  });
});

describe("parseSectionOverrides / mergeSectionOverrides", () => {
  it("keeps only known boolean keys", () => {
    expect(parseSectionOverrides({ sections: { rsvp: false, bogus: true, gift: "no" } })).toEqual({
      rsvp: false,
    });
  });

  it("merges new overrides with stored ones and preserves unrelated settings keys", () => {
    expect(mergeSectionOverrides({ other: 1, sections: { gift: false } }, { rsvp: false })).toEqual(
      { other: 1, sections: { gift: false, rsvp: false } },
    );
    expect(mergeSectionOverrides(null, { wishes: false })).toEqual({
      sections: { wishes: false },
    });
  });
});

describe("findNonToggleableSections", () => {
  it("flags identity for OTHER only", () => {
    expect(findNonToggleableSections("OTHER", { identity: false, rsvp: false })).toEqual([
      "identity",
    ]);
    expect(findNonToggleableSections("WEDDING", { identity: false })).toEqual([]);
  });
});
