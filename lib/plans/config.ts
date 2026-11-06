/**
 * Reading a `Plan` row's `features`/`limits` JSON (D-112). The JSON is
 * configuration owned by the database (docs/DATABASE.md §25), so it is
 * parsed defensively: a feature that is missing or not `true` is off, and a
 * limit that is missing or not a non-negative number means "no limit".
 * Deliberately free of `server-only` so client components can share the
 * key names and types.
 */

export const PLAN_FEATURE_KEYS = [
  "premiumTemplates",
  "guestCsv",
  "musicUpload",
  "qrCheckIn",
  "analytics",
  "gift",
  "customSlug",
  "removeBranding",
] as const;
export type PlanFeature = (typeof PLAN_FEATURE_KEYS)[number];

/**
 * - `maxEvents`: published events on this plan per owner (meaningful for
 *   the free plan; paid plans are bought per event).
 * - `maxGuests`, `maxGalleryPhotos`: per event.
 * - `activeDaysAfterEvent`: how long the invitation stays online after the
 *   event's last schedule date.
 */
export const PLAN_LIMIT_KEYS = [
  "maxEvents",
  "maxGuests",
  "maxGalleryPhotos",
  "activeDaysAfterEvent",
] as const;
export type PlanLimit = (typeof PLAN_LIMIT_KEYS)[number];

export interface PlanConfig {
  features: Record<PlanFeature, boolean>;
  limits: Record<PlanLimit, number | null>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function parsePlanConfig(features: unknown, limits: unknown): PlanConfig {
  const featureRecord = asRecord(features);
  const limitRecord = asRecord(limits);

  const parsedFeatures = Object.fromEntries(
    PLAN_FEATURE_KEYS.map((key) => [key, featureRecord[key] === true]),
  ) as Record<PlanFeature, boolean>;

  const parsedLimits = Object.fromEntries(
    PLAN_LIMIT_KEYS.map((key) => {
      const value = limitRecord[key];
      const valid = typeof value === "number" && Number.isFinite(value) && value >= 0;
      return [key, valid ? Math.floor(value) : null];
    }),
  ) as Record<PlanLimit, number | null>;

  return { features: parsedFeatures, limits: parsedLimits };
}

/**
 * When plan limits start to apply, from `PLAN_ENFORCEMENT_STARTS_AT` (an
 * ISO date or date-time). Unset means limits are off. Events created
 * before this moment keep full access (grandfathering, D-112). An invalid
 * value is reported and treated as unset, so a typo never locks owners out.
 */
export function parseEnforcementStart(raw: string | undefined): Date | null {
  const value = raw?.trim();
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    console.error(`[plans] Ignoring invalid PLAN_ENFORCEMENT_STARTS_AT: "${value}"`);
    return null;
  }
  return date;
}
