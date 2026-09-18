import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * The Playwright test runner process doesn't load .env.local the way the
 * `next dev` server it drives does (see vitest.setup.ts for the same
 * problem on the Vitest side) — needed here because this spec seeds its
 * fixtures directly via Prisma rather than through the UI.
 *
 * Fixtures are seeded directly against the real Supabase DEV database
 * (not mocked) because a full authenticated register → create → publish
 * browser flow can't be automated: the DEV project's Auth config rejects
 * synthetic email domains (see docs/STATUS.md, Phase 2 "Remaining
 * Limitation"). Seeding a User/Event/Guest directly is the same strategy
 * already used by the Vitest integration suites, just from the E2E side.
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

async function createFixtures() {
  const owner = await prisma.user.create({
    data: {
      id: `test-e2e-invite-${randomUUID()}`,
      email: `test-e2e-invite-${randomUUID()}@example.invalid`,
      name: "E2E Test Owner",
    },
  });
  createdUserIds.push(owner.id);

  const publishedEvent = await prisma.event.create({
    data: {
      ownerId: owner.id,
      type: "WEDDING",
      title: "Pernikahan E2E Uji Coba",
      slug: `e2e-invite-${randomUUID()}`,
      status: "PUBLISHED",
      description: "Undangan pernikahan untuk pengujian otomatis.",
    },
  });
  createdEventIds.push(publishedEvent.id);

  const draftEvent = await prisma.event.create({
    data: {
      ownerId: owner.id,
      type: "WEDDING",
      title: "Acara Draf E2E",
      slug: `e2e-invite-draft-${randomUUID()}`,
      status: "DRAFT",
    },
  });
  createdEventIds.push(draftEvent.id);

  await prisma.weddingProfile.create({
    data: { eventId: publishedEvent.id, brideNickname: "Ayu", groomNickname: "Budi" },
  });

  const guest = await prisma.guest.create({
    data: { eventId: publishedEvent.id, name: "Citra Dewi", normalizedName: "citra dewi" },
  });
  const guestInvitation = await prisma.guestInvitation.create({
    data: { eventId: publishedEvent.id, guestId: guest.id, token: `e2e-token-${randomUUID()}` },
  });

  // A second, unrelated event + guest to prove a token can't cross events.
  const otherEvent = await prisma.event.create({
    data: {
      ownerId: owner.id,
      type: "BIRTHDAY",
      title: "Acara Lain E2E",
      slug: `e2e-invite-other-${randomUUID()}`,
      status: "PUBLISHED",
    },
  });
  createdEventIds.push(otherEvent.id);
  const otherGuest = await prisma.guest.create({
    data: { eventId: otherEvent.id, name: "Foreign Guest", normalizedName: "foreign guest" },
  });
  const foreignToken = await prisma.guestInvitation.create({
    data: { eventId: otherEvent.id, guestId: otherGuest.id, token: `e2e-token-${randomUUID()}` },
  });

  return { publishedEvent, draftEvent, guestInvitation, foreignToken };
}

async function cleanupFixtures() {
  if (createdEventIds.length) {
    await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
    createdEventIds.length = 0;
  }
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
  await prisma.$disconnect();
}

let fixtures: Awaited<ReturnType<typeof createFixtures>>;

test.describe("public invitation", () => {
  test.beforeAll(async () => {
    fixtures = await createFixtures();
  });

  test.afterAll(async () => {
    await cleanupFixtures();
  });

  test("renders a published event's real data", async ({ page }) => {
    await page.goto(`/invite/${fixtures.publishedEvent.slug}`);
    await expect(page.getByText("Ayu & Budi")).toBeVisible();
    await expect(page.getByText("Pernikahan", { exact: true })).toBeVisible();
  });

  test("shows a generic greeting with no personalization token", async ({ page }) => {
    await page.goto(`/invite/${fixtures.publishedEvent.slug}`);
    await expect(page.getByText("Bapak/Ibu/Saudara/i Tamu Undangan")).toBeVisible();
  });

  test("personalizes the greeting for a valid guest token", async ({ page }) => {
    await page.goto(`/invite/${fixtures.publishedEvent.slug}?to=${fixtures.guestInvitation.token}`);
    await expect(page.getByText("Citra Dewi")).toBeVisible();
  });

  test("falls back to a generic greeting for a token belonging to a different event", async ({
    page,
  }) => {
    await page.goto(`/invite/${fixtures.publishedEvent.slug}?to=${fixtures.foreignToken.token}`);
    await expect(page.getByText("Bapak/Ibu/Saudara/i Tamu Undangan")).toBeVisible();
    await expect(page.getByText("Foreign Guest")).toHaveCount(0);
  });

  test("shows not-found for an unpublished (draft) event", async ({ page }) => {
    await page.goto(`/invite/${fixtures.draftEvent.slug}`);
    await expect(page.getByRole("heading", { name: "Undangan tidak ditemukan" })).toBeVisible();
  });

  test("shows not-found for a slug that doesn't exist", async ({ page }) => {
    await page.goto(`/invite/does-not-exist-${randomUUID()}`);
    await expect(page.getByRole("heading", { name: "Undangan tidak ditemukan" })).toBeVisible();
  });

  test("does not expose dashboard/admin navigation on the public page", async ({ page }) => {
    await page.goto(`/invite/${fixtures.publishedEvent.slug}`);
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Keluar" })).toHaveCount(0);
  });
});
