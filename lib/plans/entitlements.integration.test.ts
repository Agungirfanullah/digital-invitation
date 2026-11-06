/**
 * Integration tests for per-event entitlements (D-112) against the live
 * Supabase DEV database, which carries the seeded "free" and "premium"
 * plans. Every row created here is removed in `afterEach`.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getEventEntitlements, hasFeature, limitOf } from "@/lib/plans/entitlements";

const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

afterEach(async () => {
  vi.unstubAllEnvs();
  await prisma.subscription.deleteMany({ where: { userId: { in: createdUserIds } } });
  if (createdEventIds.length) {
    await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
    createdEventIds.length = 0;
  }
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

async function createEvent(createdAt?: Date) {
  const user = await prisma.user.create({
    data: {
      id: `test-plans-${randomUUID()}`,
      email: `test-plans-${randomUUID()}@example.invalid`,
      name: "Test Plans",
    },
  });
  createdUserIds.push(user.id);
  const event = await prisma.event.create({
    data: {
      ownerId: user.id,
      type: "BIRTHDAY",
      title: "Acara Paket",
      slug: `test-plans-${randomUUID()}`,
      ...(createdAt ? { createdAt } : {}),
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function buyPlan(
  event: { id: string; ownerId: string },
  planSlug: string,
  extra: { status?: "ACTIVE" | "EXPIRED"; currentPeriodEnd?: Date } = {},
) {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { slug: planSlug } });
  return prisma.subscription.create({
    data: {
      userId: event.ownerId,
      planId: plan.id,
      eventId: event.id,
      provider: "manual_transfer",
      status: extra.status ?? "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: extra.currentPeriodEnd,
    },
  });
}

describe("getEventEntitlements (integration — live Supabase DEV database)", () => {
  it("leaves everything open while enforcement is not switched on", async () => {
    vi.stubEnv("PLAN_ENFORCEMENT_STARTS_AT", "");
    const event = await createEvent();

    const entitlements = await getEventEntitlements(event.id);
    expect(entitlements.source).toBe("unenforced");
    expect(hasFeature(entitlements, "qrCheckIn")).toBe(true);
    expect(limitOf(entitlements, "maxGuests")).toBeNull();
  });

  it("stays open before a future start date", async () => {
    vi.stubEnv("PLAN_ENFORCEMENT_STARTS_AT", "2999-01-01T00:00:00Z");
    const event = await createEvent();

    expect((await getEventEntitlements(event.id)).source).toBe("unenforced");
  });

  it("applies the free plan to an event created after the start", async () => {
    vi.stubEnv("PLAN_ENFORCEMENT_STARTS_AT", "2026-01-01T00:00:00Z");
    const event = await createEvent();

    const entitlements = await getEventEntitlements(event.id);
    expect(entitlements.source).toBe("free");
    expect(entitlements.plan?.slug).toBe("free");
    expect(hasFeature(entitlements, "qrCheckIn")).toBe(false);
    expect(limitOf(entitlements, "maxGuests")).toEqual(expect.any(Number));
  });

  it("keeps full access for an event created before the start", async () => {
    vi.stubEnv("PLAN_ENFORCEMENT_STARTS_AT", "2026-01-01T00:00:00Z");
    const event = await createEvent(new Date("2025-12-31T00:00:00Z"));

    const entitlements = await getEventEntitlements(event.id);
    expect(entitlements.source).toBe("legacy");
    expect(hasFeature(entitlements, "analytics")).toBe(true);
    expect(limitOf(entitlements, "maxGuests")).toBeNull();
  });

  it("gives an event the plan bought for it, even while enforcement is off", async () => {
    vi.stubEnv("PLAN_ENFORCEMENT_STARTS_AT", "");
    const event = await createEvent();
    await buyPlan(event, "premium");

    const entitlements = await getEventEntitlements(event.id);
    expect(entitlements.source).toBe("paid");
    expect(entitlements.plan?.slug).toBe("premium");
    expect(hasFeature(entitlements, "qrCheckIn")).toBe(true);
  });

  it("does not carry a plan over to the owner's other events", async () => {
    vi.stubEnv("PLAN_ENFORCEMENT_STARTS_AT", "2026-01-01T00:00:00Z");
    const paidEvent = await createEvent();
    await buyPlan(paidEvent, "premium");
    const otherEvent = await prisma.event.create({
      data: {
        ownerId: paidEvent.ownerId,
        type: "BIRTHDAY",
        title: "Acara Lain",
        slug: `test-plans-${randomUUID()}`,
      },
    });
    createdEventIds.push(otherEvent.id);

    expect((await getEventEntitlements(otherEvent.id)).source).toBe("free");
  });

  it("ignores expired and ended subscriptions", async () => {
    vi.stubEnv("PLAN_ENFORCEMENT_STARTS_AT", "2026-01-01T00:00:00Z");
    const event = await createEvent();
    await buyPlan(event, "premium", { status: "EXPIRED" });
    await buyPlan(event, "premium", { currentPeriodEnd: new Date(Date.now() - 60_000) });

    expect((await getEventEntitlements(event.id)).source).toBe("free");
  });

  it("keeps the subscription as history when its event is deleted", async () => {
    const event = await createEvent();
    const subscription = await buyPlan(event, "premium");

    await prisma.event.delete({ where: { id: event.id } });
    createdEventIds.splice(createdEventIds.indexOf(event.id), 1);

    const kept = await prisma.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
    expect(kept.eventId).toBeNull();
  });
});
