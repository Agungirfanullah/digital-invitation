import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  parseEnforcementStart,
  parsePlanConfig,
  type PlanConfig,
  type PlanFeature,
  type PlanLimit,
} from "@/lib/plans/config";

export const FREE_PLAN_SLUG = "free";

/**
 * Why an event has the access it has (D-112):
 * - `paid`: an active plan was bought for this event.
 * - `unenforced`: plan limits are not switched on yet; everything is open.
 * - `legacy`: created before limits started; keeps full access. Creation
 *   time, not `publishedAt`, because publishing again resets `publishedAt`.
 * - `free`: the free plan's features and limits apply.
 */
export type EntitlementSource = "paid" | "unenforced" | "legacy" | "free";

export interface EventEntitlements {
  source: EntitlementSource;
  /** The plan in effect; null when access is open (`unenforced`/`legacy`). */
  plan: { slug: string; name: string } | null;
  /** Null when access is open: every feature on, no limits. */
  config: PlanConfig | null;
}

/** The free plan row is missing, so limits cannot be applied safely. */
export class PlanConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanConfigurationError";
  }
}

export function hasFeature(entitlements: EventEntitlements, feature: PlanFeature): boolean {
  return entitlements.config ? entitlements.config.features[feature] : true;
}

/** The limit for this event, or null for no limit. */
export function limitOf(entitlements: EventEntitlements, limit: PlanLimit): number | null {
  return entitlements.config ? entitlements.config.limits[limit] : null;
}

export function getEnforcementStart(): Date | null {
  return parseEnforcementStart(process.env.PLAN_ENFORCEMENT_STARTS_AT);
}

/**
 * The single place that decides what an event may use. Every limit and
 * feature check reads this (never the plan rows directly), and callers
 * must have authorized access to the event first.
 */
export async function getEventEntitlements(
  eventId: string,
  now: Date = new Date(),
): Promise<EventEntitlements> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      eventId,
      status: "ACTIVE",
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
    },
    orderBy: [{ plan: { price: "desc" } }, { createdAt: "desc" }],
    select: { plan: { select: { slug: true, name: true, features: true, limits: true } } },
  });
  if (subscription) {
    const { plan } = subscription;
    return {
      source: "paid",
      plan: { slug: plan.slug, name: plan.name },
      config: parsePlanConfig(plan.features, plan.limits),
    };
  }

  const enforcementStart = getEnforcementStart();
  if (!enforcementStart || enforcementStart > now) {
    return { source: "unenforced", plan: null, config: null };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { createdAt: true },
  });
  if (event && event.createdAt < enforcementStart) {
    return { source: "legacy", plan: null, config: null };
  }

  const freePlan = await prisma.plan.findUnique({
    where: { slug: FREE_PLAN_SLUG },
    select: { slug: true, name: true, features: true, limits: true },
  });
  if (!freePlan) {
    throw new PlanConfigurationError(`Plan "${FREE_PLAN_SLUG}" is missing from the Plan table.`);
  }
  return {
    source: "free",
    plan: { slug: freePlan.slug, name: freePlan.name },
    config: parsePlanConfig(freePlan.features, freePlan.limits),
  };
}
