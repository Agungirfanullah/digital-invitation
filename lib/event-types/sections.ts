import type { EventType } from "@prisma/client";

import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";

/**
 * Invitation section configuration (docs/PRD.md §15/§15.1,
 * docs/DATABASE.md §32). Persisted owner overrides live in
 * `Event.settings.sections`; this module is the single resolver from
 * `EventType + persisted settings` to the effective configuration, used by
 * the public projection, the editor preview, and server-side submission
 * guards alike. Client-safe: no server imports.
 *
 * `hero` (the invitation's cover — docs/PRD.md §15 "Cover") is an
 * independently toggleable section like every other one here
 * (docs/DECISIONS.md D-064). Closing remains structural and always
 * rendered — it is not a configurable section, and is out of scope for
 * D-064.
 *
 * Display order of the configurable sections (docs/PRD.md §15 "Reorder",
 * docs/DECISIONS.md D-066/D-067) is a second, independent JSON key,
 * `Event.settings.sectionOrder` — a sibling of `Event.settings.sections`,
 * not a replacement for it. Enable/disable and order are resolved and
 * persisted separately, so one can never corrupt the other. Order is
 * purely a display-sequence concern: it is not filtered by whether a
 * section is supported/enabled for the event's type — an unsupported or
 * disabled section simply renders nothing at its position, exactly as it
 * already does today.
 */

export const INVITATION_SECTION_KEYS = [
  "hero",
  "identity",
  "schedule",
  "story",
  "gallery",
  "rsvp",
  "gift",
  "wishes",
] as const;

export type InvitationSectionKey = (typeof INVITATION_SECTION_KEYS)[number];

/** Effective on/off per section — what renderers and guards consume. */
export type InvitationSections = Record<InvitationSectionKey, boolean>;

/** Persisted owner overrides. Absent key = use the type's default. */
export type SectionOverrides = Partial<Record<InvitationSectionKey, boolean>>;

export interface SectionState {
  /** The capability exists for this event type. */
  supported: boolean;
  defaultEnabled: boolean;
  /** The owner may change the default. */
  toggleable: boolean;
  /** The effective value after applying any owner override. */
  enabled: boolean;
}

export function isInvitationSectionKey(value: unknown): value is InvitationSectionKey {
  return (
    typeof value === "string" && (INVITATION_SECTION_KEYS as readonly string[]).includes(value)
  );
}

/**
 * Per-type capability defaults. Every section is Supported, Default Enabled
 * and Owner Toggleable for every type — docs/PRD.md §15.1 forbids inventing
 * per-type restrictions, and leaves per-type default on/off states as an
 * open product decision. "All enabled" is exactly the pre-configuration
 * behavior, so existing events render unchanged. The one structural
 * exception is identity for OTHER, which has no identity profile at all
 * (docs/PRD.md §13.7).
 */
function sectionDefault(type: EventType, key: InvitationSectionKey) {
  const supported = !(key === "identity" && EVENT_TYPE_CONFIG[type].family === "GENERIC");
  return { supported, defaultEnabled: supported, toggleable: supported };
}

/**
 * Reads owner overrides out of the untyped `Event.settings` JSON. Fails
 * safe: anything that isn't a plain object of known-key booleans is
 * ignored (falls back to defaults), never thrown.
 */
export function parseSectionOverrides(settings: unknown): SectionOverrides {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return {};
  const sections = (settings as Record<string, unknown>).sections;
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) return {};

  const overrides: SectionOverrides = {};
  for (const [key, value] of Object.entries(sections)) {
    if (isInvitationSectionKey(key) && typeof value === "boolean") overrides[key] = value;
  }
  return overrides;
}

export function resolveSectionStates(
  type: EventType,
  settings: unknown,
): Record<InvitationSectionKey, SectionState> {
  const overrides = parseSectionOverrides(settings);
  const states = {} as Record<InvitationSectionKey, SectionState>;

  for (const key of INVITATION_SECTION_KEYS) {
    const base = sectionDefault(type, key);
    const override = base.toggleable ? overrides[key] : undefined;
    states[key] = { ...base, enabled: base.supported && (override ?? base.defaultEnabled) };
  }

  return states;
}

export function resolveEnabledSections(type: EventType, settings: unknown): InvitationSections {
  const states = resolveSectionStates(type, settings);
  const enabled = {} as InvitationSections;
  for (const key of INVITATION_SECTION_KEYS) enabled[key] = states[key].enabled;
  return enabled;
}

/**
 * Keys in `overrides` that the type doesn't allow the owner to change.
 * Used server-side to reject a crafted request instead of silently
 * persisting an override that would never apply.
 */
export function findNonToggleableSections(
  type: EventType,
  overrides: SectionOverrides,
): InvitationSectionKey[] {
  return (Object.keys(overrides) as InvitationSectionKey[]).filter(
    (key) => !sectionDefault(type, key).toggleable,
  );
}

/** Merges new overrides into existing `Event.settings`, preserving any unrelated keys. */
export function mergeSectionOverrides(
  settings: unknown,
  overrides: SectionOverrides,
): { sections: SectionOverrides } & Record<string, unknown> {
  const base =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? (settings as Record<string, unknown>)
      : {};
  return { ...base, sections: { ...parseSectionOverrides(settings), ...overrides } };
}

// ---------------------------------------------------------------------------
// Section order (docs/PRD.md §15 "Reorder", D-066/D-067)
// ---------------------------------------------------------------------------

/**
 * Reads a persisted section order out of the untyped `Event.settings` JSON.
 * Fails safe: anything that isn't a non-empty array is ignored (returns
 * `null`, meaning "no persisted order"), never thrown. Unknown keys are
 * dropped and duplicates are collapsed to their first occurrence (Cases
 * D/E) — this never lets a corrupted/legacy value become a renderable,
 * duplicated, or fabricated section position.
 */
export function parseSectionOrder(settings: unknown): InvitationSectionKey[] | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const order = (settings as Record<string, unknown>).sectionOrder;
  if (!Array.isArray(order)) return null;

  const seen = new Set<InvitationSectionKey>();
  const cleaned: InvitationSectionKey[] = [];
  for (const item of order) {
    if (isInvitationSectionKey(item) && !seen.has(item)) {
      seen.add(item);
      cleaned.push(item);
    }
  }
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * The effective display order of every configurable section (Closing is
 * never included — it isn't a member of `InvitationSectionKey` at all).
 *
 * - No persisted order (Case A), or a persisted value that fails safe to
 *   nothing usable: falls back to the canonical `INVITATION_SECTION_KEYS`
 *   order — existing events with no `sectionOrder` key render exactly as
 *   before.
 * - A persisted order naming every key (Case B): used as-is.
 * - A persisted order naming only some keys (Case C — e.g. an older
 *   partial value from before a new section key like `hero` existed):
 *   any missing keys are appended afterward, in their canonical order, so
 *   a section already implemented and rendering elsewhere in the app
 *   never silently disappears from an invitation merely because an older
 *   persisted order predates it.
 *
 * Enable/disable state is resolved completely independently
 * (`resolveEnabledSections`) — a section's position here says nothing
 * about whether it renders; a disabled section still occupies a slot in
 * this order, and simply renders nothing there, exactly as it already did
 * with the previous hard-coded sequence.
 */
export function resolveSectionOrder(settings: unknown): InvitationSectionKey[] {
  const persisted = parseSectionOrder(settings);
  if (!persisted) return [...INVITATION_SECTION_KEYS];

  const missing = INVITATION_SECTION_KEYS.filter((key) => !persisted.includes(key));
  return [...persisted, ...missing];
}

/** Merges a new order into existing `Event.settings`, preserving `sections` and any other unrelated keys. */
export function mergeSectionOrder(
  settings: unknown,
  order: InvitationSectionKey[],
): { sectionOrder: InvitationSectionKey[] } & Record<string, unknown> {
  const base =
    settings && typeof settings === "object" && !Array.isArray(settings)
      ? (settings as Record<string, unknown>)
      : {};
  return { ...base, sectionOrder: order };
}

/**
 * The keys that are reorderable (= supported, docs/PRD.md §15.1) for
 * `type` — purely a function of type, independent of any owner overrides.
 * `identity` is the only section this ever excludes (for `OTHER`, which
 * has no identity profile — docs/PRD.md §13.7). Used so a section's
 * position can be resolved relative to its true visible neighbors, not
 * raw array adjacency in the canonical 8-key order, which may include a
 * currently-unsupported key at any position.
 */
export function getReorderableSectionKeys(type: EventType): InvitationSectionKey[] {
  return INVITATION_SECTION_KEYS.filter((key) => sectionDefault(type, key).supported);
}

/**
 * Pure — swaps the target section with its nearest neighbor in display
 * order, in the given direction. Returns `null` when the key isn't found
 * in `order`, isn't itself reorderable, or has no reorderable neighbor in
 * that direction (already at the relevant edge — nothing to do), mirroring
 * `lib/editor/service.ts`'s `resolveGalleryMoveSwap()` for gallery items —
 * the caller can no-op cleanly instead of persisting a pointless identical
 * order. Closing can never be passed here: it has no `InvitationSectionKey`
 * value to represent it.
 *
 * `reorderableKeys` (typically `getReorderableSectionKeys(type)`) restricts
 * which positions in `order` count as a real neighbor. An unsupported
 * section (e.g. `identity` for `OTHER`) still occupies a slot in `order`,
 * but is invisible in the editor and must never act as a reorder barrier
 * or a swap target — the nearest *reorderable* neighbor is found by
 * stepping past any unsupported slots in between. Omitting `reorderableKeys`
 * (or passing every key in `order`) preserves the original "swap with the
 * literal adjacent index" behavior for callers with no type context.
 */
export function resolveSectionMoveSwap(
  order: InvitationSectionKey[],
  key: InvitationSectionKey,
  direction: "up" | "down",
  reorderableKeys?: readonly InvitationSectionKey[],
): { indexA: number; indexB: number } | null {
  const index = order.indexOf(key);
  if (index === -1) return null;

  const reorderable = reorderableKeys ? new Set(reorderableKeys) : null;
  if (reorderable && !reorderable.has(key)) return null;

  const step = direction === "up" ? -1 : 1;
  for (
    let targetIndex = index + step;
    targetIndex >= 0 && targetIndex < order.length;
    targetIndex += step
  ) {
    if (!reorderable || reorderable.has(order[targetIndex])) {
      return { indexA: index, indexB: targetIndex };
    }
  }
  return null;
}

export function getSectionLabel(type: EventType, key: InvitationSectionKey): string {
  const config = EVENT_TYPE_CONFIG[type];
  switch (key) {
    case "hero":
      return "Sampul";
    case "identity":
      return config.identityHeading;
    case "schedule":
      return "Jadwal Acara";
    case "story":
      return config.storyNavLabel;
    case "gallery":
      return "Galeri";
    case "rsvp":
      return "Konfirmasi Kehadiran (RSVP)";
    case "gift":
      return "Kirim Hadiah";
    case "wishes":
      return "Ucapan & Doa";
  }
}
