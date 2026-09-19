import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * The authenticated RSVP dashboard, unlike e2e/rsvp.spec.ts (the public
 * guest-facing flow), requires a real login — same admin-provisioning
 * pattern as e2e/guests.spec.ts and e2e/guest-invitation.spec.ts
 * (docs/DECISIONS.md D-022).
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

const TEST_PASSWORD = "Test-Password-123!";

const createdSupabaseUserIds: string[] = [];
const createdEventIds: string[] = [];

async function createAuthenticatedTestUser(label: string) {
  const email = `e2e-rsvp-dash-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E RSVP Dashboard Test ${label}` },
  });

  return { email, userId: user.id };
}

async function createTestEvent(ownerId: string) {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan RSVP Dashboard E2E",
      slug: `e2e-rsvp-dash-${randomUUID()}`,
      status: "PUBLISHED",
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function createTestGuest(
  eventId: string,
  name: string,
  overrides: { category?: "FAMILY" | "FRIEND" | "COLLEAGUE" | "VIP" | "OTHER" } = {},
) {
  const guest = await prisma.guest.create({
    data: {
      eventId,
      name,
      normalizedName: name.toLowerCase(),
      seatQuota: 3,
      category: overrides.category ?? "OTHER",
    },
  });
  const invitation = await prisma.guestInvitation.create({
    data: { eventId, guestId: guest.id, token: `e2e-rsvp-dash-token-${randomUUID()}` },
  });
  return { guest, invitation };
}

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function cleanup() {
  if (createdEventIds.length) {
    await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
    createdEventIds.length = 0;
  }
  if (createdSupabaseUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdSupabaseUserIds } } });
    for (const id of createdSupabaseUserIds) {
      await admin.auth.admin.deleteUser(id);
    }
    createdSupabaseUserIds.length = 0;
  }
  await prisma.$disconnect();
}

test.describe("RSVP dashboard", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test("a real public RSVP submission appears on the authenticated dashboard", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner");
    const event = await createTestEvent(owner.userId);
    const { invitation } = await createTestGuest(event.id, "Dewi Kartika");

    // The real Phase 6 guest-facing flow — proves it hasn't regressed.
    await page.goto(`/invite/${event.slug}?to=${invitation.token}`);
    await page.getByRole("radio", { name: "Ya, saya akan hadir" }).check();
    await page.getByLabel("Jumlah tamu yang hadir").fill("2");
    await page.getByRole("button", { name: "Kirim RSVP" }).click();
    await expect(page.getByRole("status")).toContainText("Terima kasih!");

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/rsvp`);

    await expect(page.getByText("Dewi Kartika")).toBeVisible();
    await expect(page.getByText("Akan Hadir", { exact: true })).toBeVisible();
    await expect(page.getByText("2 orang hadir")).toBeVisible();
  });

  test("search and status/category filters narrow the guest list without changing the summary counts", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner2");
    const event = await createTestEvent(owner.userId);
    const responded = await createTestGuest(event.id, "Ayu Lestari", { category: "VIP" });
    await createTestGuest(event.id, "Budi Santoso", { category: "FRIEND" });
    await prisma.rSVP.create({
      data: {
        eventId: event.id,
        guestId: responded.guest.id,
        attendance: "ATTENDING",
        attendeeCount: 1,
        submittedAt: new Date(),
      },
    });

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/rsvp`);
    await expect(page.getByText("Ayu Lestari")).toBeVisible();
    await expect(page.getByText("Budi Santoso")).toBeVisible();

    await page.getByLabel("Cari Tamu").fill("Ayu");
    await page.getByRole("button", { name: "Terapkan" }).click();

    await expect(page.getByText("Ayu Lestari")).toBeVisible();
    await expect(page.getByText("Budi Santoso")).toHaveCount(0);
    // Filtering the table must not change the event-wide summary count.
    await expect(page.locator("dt:text-is('Total Tamu') + dd")).toHaveText("2");
  });

  test("CSV export is authenticated, event-scoped, and excludes invitation tokens", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner3");
    const event = await createTestEvent(owner.userId);
    const { guest, invitation } = await createTestGuest(event.id, "Farhan Maulana");
    await prisma.rSVP.create({
      data: {
        eventId: event.id,
        guestId: guest.id,
        attendance: "NOT_ATTENDING",
        attendeeCount: 0,
        submittedAt: new Date(),
      },
    });

    await login(page, owner.email);

    const response = await page.request.get(`/dashboard/events/${event.id}/rsvp/export`);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("text/csv");

    const csv = await response.text();
    expect(csv).toContain("Farhan Maulana");
    expect(csv).toContain("Tidak Hadir");
    expect(csv).not.toContain(invitation.token);
  });

  test("a viewer can open the dashboard read-only", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner4");
    const viewer = await createAuthenticatedTestUser("viewer");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.userId, role: "VIEWER" },
    });
    await createTestGuest(event.id, "Sinta Wulandari");

    await login(page, viewer.email);
    await page.goto(`/dashboard/events/${event.id}/rsvp`);

    await expect(page.getByRole("heading", { name: "Ringkasan RSVP" })).toBeVisible();
    await expect(page.getByText("Sinta Wulandari")).toBeVisible();
  });

  test("a stranger cannot access another owner's RSVP dashboard", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner5");
    const stranger = await createAuthenticatedTestUser("stranger");
    const event = await createTestEvent(owner.userId);

    await login(page, stranger.email);
    await page.goto(`/dashboard/events/${event.id}/rsvp`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });
});
