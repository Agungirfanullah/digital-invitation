/**
 * Opening / Reveal MVP behavior (docs/PRD.md §17, docs/DECISIONS.md
 * D-069). Client-safe, pure functions only — no server imports.
 *
 * Opening is deliberately NOT part of `lib/event-types/sections.ts` — it
 * is a structural gate (D-069-02), not a member of
 * `INVITATION_SECTION_KEYS`, and does not participate in `sectionOrder`.
 * Its enable/disable state is a separate, independent key in the same
 * `Event.settings` JSON object.
 */

/**
 * Reads whether Opening is enabled from the untyped `Event.settings`
 * JSON. Fails safe: anything that isn't an explicit `false` resolves to
 * enabled — this is the documented default (§17: "New event
 * configuration defaults to Opening enabled; existing invitations that
 * predate this feature use that same default, with no data migration
 * required").
 */
export function resolveOpeningEnabled(settings: unknown): boolean {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return true;
  const value = (settings as Record<string, unknown>).openingEnabled;
  return value !== false;
}
