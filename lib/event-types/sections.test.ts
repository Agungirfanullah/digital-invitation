import { describe, expect, it } from "vitest";
import { EventType } from "@prisma/client";

import {
  findNonToggleableSections,
  getReorderableSectionKeys,
  INVITATION_SECTION_KEYS,
  mergeSectionOrder,
  mergeSectionOverrides,
  parseSectionOrder,
  parseSectionOverrides,
  resolveEnabledSections,
  resolveSectionMoveSwap,
  resolveSectionOrder,
  resolveSectionStates,
  type InvitationSectionKey,
} from "@/lib/event-types/sections";

const ALL_TYPES = Object.values(EventType);

describe("resolveSectionStates — defaults", () => {
  it("every section is Supported, Default Enabled and Owner Toggleable for every type (PRD §15.1), except identity for OTHER and countdown (D-068, defaults off everywhere)", () => {
    for (const type of ALL_TYPES) {
      const states = resolveSectionStates(type, null);
      for (const key of INVITATION_SECTION_KEYS) {
        const expectedSupported = !(type === "OTHER" && key === "identity");
        const expectedDefaultEnabled = expectedSupported && key !== "countdown";
        expect(states[key]).toEqual({
          supported: expectedSupported,
          defaultEnabled: expectedDefaultEnabled,
          toggleable: expectedSupported,
          enabled: expectedDefaultEnabled,
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

// --- D-064: hero is an independently toggleable section --------------------

describe("hero section (D-064)", () => {
  it("exists in the canonical section keys", () => {
    expect(INVITATION_SECTION_KEYS).toContain("hero");
  });

  it("defaults to enabled for every event type", () => {
    for (const type of ALL_TYPES) {
      expect(resolveEnabledSections(type, null).hero).toBe(true);
    }
  });

  it("a missing hero override resolves to enabled, even when other overrides are set", () => {
    expect(resolveEnabledSections("WEDDING", { sections: { identity: false } }).hero).toBe(true);
  });

  it("can be explicitly disabled, independently of identity/schedule", () => {
    const enabled = resolveEnabledSections("WEDDING", {
      sections: { hero: false, identity: true, schedule: true },
    });
    expect(enabled.hero).toBe(false);
    expect(enabled.identity).toBe(true);
    expect(enabled.schedule).toBe(true);
  });

  it("disabling identity/schedule does not disable hero, and vice versa", () => {
    expect(resolveEnabledSections("WEDDING", { sections: { identity: false } }).hero).toBe(true);
    expect(resolveEnabledSections("WEDDING", { sections: { schedule: false } }).hero).toBe(true);
    expect(resolveEnabledSections("WEDDING", { sections: { hero: false } }).identity).toBe(true);
    expect(resolveEnabledSections("WEDDING", { sections: { hero: false } }).schedule).toBe(true);
  });

  it("is toggleable for every event type, including OTHER (which only restricts identity)", () => {
    for (const type of ALL_TYPES) {
      expect(findNonToggleableSections(type, { hero: false })).toEqual([]);
    }
  });
});

// --- D-068: countdown defaults off, everywhere ------------------------------

describe("countdown section (D-068)", () => {
  it("exists in the canonical section keys", () => {
    expect(INVITATION_SECTION_KEYS).toContain("countdown");
  });

  it("defaults to disabled for every event type — existing events must not suddenly display it", () => {
    for (const type of ALL_TYPES) {
      expect(resolveEnabledSections(type, null).countdown).toBe(false);
    }
  });

  it("is still Supported and Owner Toggleable for every event type (only the default differs)", () => {
    for (const type of ALL_TYPES) {
      expect(resolveSectionStates(type, null).countdown).toEqual({
        supported: true,
        defaultEnabled: false,
        toggleable: true,
        enabled: false,
      });
      expect(findNonToggleableSections(type, { countdown: false })).toEqual([]);
    }
  });

  it("can be explicitly enabled via an owner override, independently of other sections", () => {
    const enabled = resolveEnabledSections("WEDDING", { sections: { countdown: true } });
    expect(enabled.countdown).toBe(true);
    expect(enabled.hero).toBe(true);
    expect(enabled.schedule).toBe(true);
  });

  it("enabling/disabling countdown does not affect schedule, and vice versa", () => {
    expect(resolveEnabledSections("WEDDING", { sections: { schedule: false } }).countdown).toBe(
      false,
    );
    expect(
      resolveEnabledSections("WEDDING", { sections: { countdown: true, schedule: false } })
        .schedule,
    ).toBe(false);
  });

  it("participates in reordering like any other section", () => {
    for (const type of ALL_TYPES) {
      expect(getReorderableSectionKeys(type)).toContain("countdown");
    }
  });
});

// --- D-067: section reordering ---------------------------------------------

describe("resolveSectionOrder", () => {
  it("Case A — no persisted order falls back to the canonical order", () => {
    expect(resolveSectionOrder(null)).toEqual(INVITATION_SECTION_KEYS);
    expect(resolveSectionOrder(undefined)).toEqual(INVITATION_SECTION_KEYS);
    expect(resolveSectionOrder({})).toEqual(INVITATION_SECTION_KEYS);
  });

  it("Case B — a valid, complete persisted order is used as-is", () => {
    const custom = [
      "gallery",
      "hero",
      "story",
      "identity",
      "countdown",
      "schedule",
      "rsvp",
      "gift",
      "wishes",
    ];
    expect(resolveSectionOrder({ sectionOrder: custom })).toEqual(custom);
  });

  it("Case C — a partial persisted order appends missing keys in canonical order", () => {
    const partial = ["wishes", "hero"];
    const missing = INVITATION_SECTION_KEYS.filter((key) => !partial.includes(key));
    expect(resolveSectionOrder({ sectionOrder: partial })).toEqual([...partial, ...missing]);
  });

  it("Case D — unknown keys are dropped and never appear in the resolved order", () => {
    const withBogus = ["hero", "not-a-section", "gallery"];
    const resolved = resolveSectionOrder({ sectionOrder: withBogus });
    expect(resolved).not.toContain("not-a-section");
    expect(resolved).toHaveLength(INVITATION_SECTION_KEYS.length);
  });

  it("Case E — duplicate keys are collapsed to a single occurrence", () => {
    const withDupes = ["hero", "gallery", "hero", "wishes"];
    const resolved = resolveSectionOrder({ sectionOrder: withDupes });
    expect(resolved.filter((key) => key === "hero")).toHaveLength(1);
    expect(resolved).toHaveLength(INVITATION_SECTION_KEYS.length);
  });

  it("Case G — a disabled section's key still holds its position (order is independent of enabled state)", () => {
    const custom = [
      "wishes",
      "hero",
      "gallery",
      "identity",
      "countdown",
      "schedule",
      "rsvp",
      "gift",
      "story",
    ];
    // resolveSectionOrder only concerns position; enabled/disabled is resolveEnabledSections's job.
    expect(resolveSectionOrder({ sectionOrder: custom })).toEqual(custom);
  });

  it("falls back to canonical order for a legacy settings object that only has boolean overrides", () => {
    expect(resolveSectionOrder({ sections: { rsvp: false } })).toEqual(INVITATION_SECTION_KEYS);
  });

  it("Closing can never appear in the resolved order — it has no InvitationSectionKey value", () => {
    const resolved = resolveSectionOrder({
      sectionOrder: [...INVITATION_SECTION_KEYS, "closing"],
    });
    expect(resolved).not.toContain("closing");
    expect(resolved).toHaveLength(INVITATION_SECTION_KEYS.length);
  });

  it("is deterministic: the same settings always resolve to the same order", () => {
    const settings = { sectionOrder: ["wishes", "hero"] };
    expect(resolveSectionOrder(settings)).toEqual(resolveSectionOrder(settings));
  });

  it("fails safe on malformed settings", () => {
    for (const settings of ["x", 42, [], { sectionOrder: null }, { sectionOrder: "hero" }]) {
      expect(resolveSectionOrder(settings)).toEqual(INVITATION_SECTION_KEYS);
    }
  });
});

describe("parseSectionOrder / mergeSectionOrder", () => {
  it("returns null when nothing valid is persisted", () => {
    expect(parseSectionOrder(null)).toBeNull();
    expect(parseSectionOrder({})).toBeNull();
    expect(parseSectionOrder({ sectionOrder: [] })).toBeNull();
    expect(parseSectionOrder({ sectionOrder: ["not-a-section"] })).toBeNull();
  });

  it("keeps only known keys and drops duplicates", () => {
    expect(parseSectionOrder({ sectionOrder: ["hero", "bogus", "hero", "gallery"] })).toEqual([
      "hero",
      "gallery",
    ]);
  });

  it("merges the new order and preserves unrelated settings keys, including the boolean sections map", () => {
    expect(mergeSectionOrder({ other: 1, sections: { gift: false } }, ["wishes", "hero"])).toEqual({
      other: 1,
      sections: { gift: false },
      sectionOrder: ["wishes", "hero"],
    });
    expect(mergeSectionOrder(null, ["hero"])).toEqual({ sectionOrder: ["hero"] });
  });
});

describe("resolveSectionMoveSwap", () => {
  const order = [...INVITATION_SECTION_KEYS];

  it("swaps with the previous index when moving up", () => {
    expect(resolveSectionMoveSwap(order, order[2], "up")).toEqual({ indexA: 2, indexB: 1 });
  });

  it("swaps with the next index when moving down", () => {
    expect(resolveSectionMoveSwap(order, order[2], "down")).toEqual({ indexA: 2, indexB: 3 });
  });

  it("returns null when moving the first item up", () => {
    expect(resolveSectionMoveSwap(order, order[0], "up")).toBeNull();
  });

  it("returns null when moving the last item down", () => {
    expect(resolveSectionMoveSwap(order, order[order.length - 1], "down")).toBeNull();
  });

  it("returns null when the key is not found in the order", () => {
    const shortOrder = order.slice(1);
    expect(resolveSectionMoveSwap(shortOrder, order[0], "up")).toBeNull();
  });
});

// --- D-067-FIX: unsupported sections must not act as reorder barriers ------
//
// `identity` is unsupported for OTHER (the only such case today). A
// hidden/unsupported slot must never block or become the swap target for
// an adjacent supported section's move.

describe("resolveSectionMoveSwap — unsupported-section adjacency (D-067-FIX)", () => {
  // hero, identity(unsupported), schedule, story, gallery, rsvp, gift, wishes
  const order = [...INVITATION_SECTION_KEYS];
  const reorderable = getReorderableSectionKeys("OTHER");

  it("Test 1 — moving a supported section up skips the hidden unsupported section", () => {
    // countdown (index 2) sits immediately after the hidden identity
    // (index 1). Moving it up must land next to hero (index 0), not swap
    // with the hidden identity slot in between.
    const swap = resolveSectionMoveSwap(order, "countdown", "up", reorderable);
    expect(swap).toEqual({ indexA: 2, indexB: 0 });

    const reordered = [...order];
    [reordered[swap!.indexA], reordered[swap!.indexB]] = [
      reordered[swap!.indexB],
      reordered[swap!.indexA],
    ];
    // identity keeps its slot (still present, still index 1) — not deleted.
    expect(reordered).toEqual([
      "countdown",
      "identity",
      "hero",
      "schedule",
      "story",
      "gallery",
      "rsvp",
      "gift",
      "wishes",
    ]);
    expect(reordered.filter((key) => reorderable.includes(key))).toEqual([
      "countdown",
      "hero",
      "schedule",
      "story",
      "gallery",
      "rsvp",
      "gift",
      "wishes",
    ]);
  });

  it("Test 2 — moving a supported section down skips the hidden unsupported section", () => {
    // Starting from the post-Test-1 order, countdown (index 0) moving down
    // must land next to hero (index 2), skipping the hidden identity.
    const rearranged: InvitationSectionKey[] = [
      "countdown",
      "identity",
      "hero",
      "schedule",
      "story",
      "gallery",
      "rsvp",
      "gift",
      "wishes",
    ];
    const swap = resolveSectionMoveSwap(rearranged, "countdown", "down", reorderable);
    expect(swap).toEqual({ indexA: 0, indexB: 2 });

    const reordered = [...rearranged];
    [reordered[swap!.indexA], reordered[swap!.indexB]] = [
      reordered[swap!.indexB],
      reordered[swap!.indexA],
    ];
    expect(reordered).toEqual(order); // back to canonical
  });

  it("Test 3 — hero (first reorderable section) cannot move up, regardless of the hidden section", () => {
    expect(resolveSectionMoveSwap(order, "hero", "up", reorderable)).toBeNull();
  });

  it("Test 4 — wishes (last reorderable section) cannot move down, regardless of the hidden section", () => {
    expect(resolveSectionMoveSwap(order, "wishes", "down", reorderable)).toBeNull();
  });

  it("no-ops when asked to move a key that isn't itself reorderable", () => {
    expect(resolveSectionMoveSwap(order, "identity", "up", reorderable)).toBeNull();
    expect(resolveSectionMoveSwap(order, "identity", "down", reorderable)).toBeNull();
  });

  it("omitting reorderableKeys preserves the original literal-adjacent-index behavior", () => {
    expect(resolveSectionMoveSwap(order, "schedule", "up")).toEqual({ indexA: 3, indexB: 2 });
  });
});

describe("getReorderableSectionKeys", () => {
  it("excludes identity for OTHER only", () => {
    expect(getReorderableSectionKeys("OTHER")).not.toContain("identity");
    expect(getReorderableSectionKeys("OTHER")).toHaveLength(INVITATION_SECTION_KEYS.length - 1);
  });

  it("includes every section for every other event type", () => {
    for (const type of ALL_TYPES) {
      if (type === "OTHER") continue;
      expect(getReorderableSectionKeys(type)).toEqual(INVITATION_SECTION_KEYS);
    }
  });

  it("preserves canonical relative order", () => {
    expect(getReorderableSectionKeys("OTHER")).toEqual(
      INVITATION_SECTION_KEYS.filter((key) => key !== "identity"),
    );
  });
});
