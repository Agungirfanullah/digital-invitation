import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * The guest-facing RSVP flow is public and unauthenticated (the guest
 * never logs in — their identity comes entirely from the `?to=` token),
 * so fixtures are seeded directly via Prisma, the same pattern already
 * established by e2e/invitation.spec.ts for Phase 3. No admin-provisioned
 * login is needed for this half of the suite.
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

async function createFixtures() {
  const owner = await prisma.user.create({
    data: {
      id: `test-e2e-rsvp-${randomUUID()}`,
      email: `test-e2e-rsvp-${randomUUID()}@example.invalid`,
      name: "E2E RSVP Test Owner",
    },
  });
  createdUserIds.push(owner.id);

  const event = await prisma.event.create({
    data: {
      ownerId: owner.id,
      type: "WEDDING",
      title: "Pernikahan RSVP E2E",
      slug: `e2e-rsvp-${randomUUID()}`,
      status: "PUBLISHED",
    },
  });
  createdEventIds.push(event.id);
  await prisma.weddingProfile.create({
    data: { eventId: event.id, brideNickname: "Ayu", groomNickname: "Budi" },
  });

  const guest = await prisma.guest.create({
    data: { eventId: event.id, name: "Dewi Kartika", normalizedName: "dewi kartika", seatQuota: 3 },
  });
  const invitation = await prisma.guestInvitation.create({
    data: { eventId: event.id, guestId: guest.id, token: `e2e-rsvp-token-${randomUUID()}` },
  });

  // A second, unrelated event + guest to prove a token can't cross events.
  const otherEvent = await prisma.event.create({
    data: {
      ownerId: owner.id,
      type: "BIRTHDAY",
      title: "Acara Lain RSVP E2E",
      slug: `e2e-rsvp-other-${randomUUID()}`,
      status: "PUBLISHED",
    },
  });
  createdEventIds.push(otherEvent.id);
  const otherGuest = await prisma.guest.create({
    data: { eventId: otherEvent.id, name: "Tamu Asing", normalizedName: "tamu asing" },
  });
  const foreignInvitation = await prisma.guestInvitation.create({
    data: {
      eventId: otherEvent.id,
      guestId: otherGuest.id,
      token: `e2e-rsvp-token-${randomUUID()}`,
    },
  });

  return { event, guest, invitation, foreignInvitation };
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

test.describe("RSVP", () => {
  test.beforeAll(async () => {
    fixtures = await createFixtures();
  });

  test.afterAll(async () => {
    await cleanupFixtures();
  });

  test("a non-personalized invitation cannot submit a guest-specific RSVP", async ({ page }) => {
    await page.goto(`/invite/${fixtures.event.slug}`);
    await expect(
      page.getByText("RSVP hanya dapat diisi melalui tautan undangan pribadi Anda."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Apakah Anda akan hadir?" })).toHaveCount(0);
  });

  test("a token belonging to a different event cannot submit an RSVP for this event", async ({
    page,
  }) => {
    await page.goto(`/invite/${fixtures.event.slug}?to=${fixtures.foreignInvitation.token}`);
    await expect(
      page.getByText("RSVP hanya dapat diisi melalui tautan undangan pribadi Anda."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Apakah Anda akan hadir?" })).toHaveCount(0);
  });

  // Deliberately one test, not several — each step depends on the
  // previous one's mutation (submit → reload → update → reload), and
  // Playwright's `fullyParallel` config would let independent tests touching
  // the same guest race each other.
  test("a personalized guest can submit, reload, and update their RSVP", async ({ page }) => {
    await page.goto(`/invite/${fixtures.event.slug}?to=${fixtures.invitation.token}`);

    await expect(page.getByRole("heading", { name: "Apakah Anda akan hadir?" })).toBeVisible();
    await expect(page.getByText("Halo Dewi Kartika")).toBeVisible();

    await page.getByRole("radio", { name: "Ya, saya akan hadir" }).check();
    await expect(page.getByText("Kuota kursi Anda: maksimal 3 orang.")).toBeVisible();
    await page.getByLabel("Jumlah tamu yang hadir").fill("2");
    await page.getByRole("button", { name: "Kirim RSVP" }).click();
    await expect(page.getByRole("status")).toContainText("Terima kasih!");

    // Persisted server-side, not just local state.
    await page.reload();
    await expect(page.getByRole("radio", { name: "Ya, saya akan hadir" })).toBeChecked();
    await expect(page.getByLabel("Jumlah tamu yang hadir")).toHaveValue("2");

    // The same guest can change their answer.
    await page.getByRole("radio", { name: "Maaf, saya tidak dapat hadir" }).check();
    await page.getByRole("button", { name: "Perbarui RSVP" }).click();
    await expect(page.getByRole("status")).toContainText("Tidak Hadir");
    await expect(page.getByLabel("Jumlah tamu yang hadir")).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("radio", { name: "Maaf, saya tidak dapat hadir" })).toBeChecked();
  });
});
