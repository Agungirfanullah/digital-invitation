/**
 * Integration test for `getActivePlans()`, run against the real Supabase
 * DEV Postgres database via Prisma — same rationale as every other
 * integration suite in this repo. Relies on the Phase 0 seed data
 * (`prisma/seed.ts`) already being present (Free/Premium/Business),
 * exactly as `lib/editor/service.integration.test.ts` already relies on
 * seeded templates.
 */
import { describe, expect, it } from "vitest";

import { getActivePlans } from "@/lib/plans/service";

describe("getActivePlans", () => {
  it("returns the seeded active plans, cheapest first, with numeric prices and limits", async () => {
    const plans = await getActivePlans();

    expect(plans.length).toBeGreaterThanOrEqual(3);

    const slugs = plans.map((plan) => plan.slug);
    expect(slugs).toContain("free");
    expect(slugs).toContain("premium");
    expect(slugs).toContain("business");

    const free = plans.find((plan) => plan.slug === "free")!;
    expect(free.price).toBe(0);
    expect(free.maxEvents).toBe(1);
    expect(free.maxGuests).toBe(30);

    const premium = plans.find((plan) => plan.slug === "premium")!;
    expect(premium.price).toBe(99000);

    // Cheapest first.
    for (let i = 1; i < plans.length; i++) {
      expect(plans[i].price).toBeGreaterThanOrEqual(plans[i - 1].price);
    }
  });
});
