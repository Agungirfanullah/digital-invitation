import "server-only";

import { prisma } from "@/lib/db/prisma";

/**
 * Read-only projection of `Plan` for public display (Homepage Pricing —
 * docs/PRD.md §42, D-073). `price`/`limits` are read from the database,
 * never hardcoded — docs/DATABASE.md §25: "Do not hardcode pricing or
 * limits in application UI." `price` is converted from Prisma's `Decimal`
 * to a plain `number` here (server-only file) so callers never need to
 * import/serialize a `Decimal` themselves.
 */
export interface PublicPlan {
  name: string;
  slug: string;
  price: number;
  currency: string;
  maxEvents: number | null;
  maxGuests: number | null;
}

function readLimit(limits: unknown, key: string): number | null {
  if (!limits || typeof limits !== "object" || Array.isArray(limits)) return null;
  const value = (limits as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

/** Active plans, cheapest first — the only ordering PRD §42 implies (Free, Premium, Business). */
export async function getActivePlans(): Promise<PublicPlan[]> {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: { name: true, slug: true, price: true, currency: true, limits: true },
  });

  return plans.map((plan) => ({
    name: plan.name,
    slug: plan.slug,
    price: Number(plan.price),
    currency: plan.currency,
    maxEvents: readLimit(plan.limits, "maxEvents"),
    maxGuests: readLimit(plan.limits, "maxGuests"),
  }));
}
