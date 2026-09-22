import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * The public half of this flow (opening `/invite/[slug]`) is
 * unauthenticated — real browser navigation, so the `proxy.ts` cookie
 * assignment and the page's `trackPublicInvitationView()` call both run
 * for real, not simulated. The dashboard half needs a real login, same
 * pattern as e2e/wishes.spec.ts / e2e/check-in.spec.ts.
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
const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

async function createAuthenticatedTestUser(label: string) {
  const email = `e2e-analytics-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Analytics Test ${label}` },
  });

  return { email, userId: user.id };
}

async function createTestEvent(ownerId: string, status: "DRAFT" | "PUBLISHED" = "PUBLISHED") {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Analitik E2E",
      slug: `e2e-analytics-${randomUUID()}`,
      status,
    },
  });
  createdEventIds.push(event.id);
  return event;
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
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
  if (createdSupabaseUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdSupabaseUserIds } } });
    for (const id of createdSupabaseUserIds) {
      await admin.auth.admin.deleteUser(id);
    }
    createdSupabaseUserIds.length = 0;
  }
}

test.describe("analytics", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("opening the public invitation tracks a real view that appears on the owner's analytics dashboard", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner");
    const event = await createTestEvent(owner.userId);

    // Real, unauthenticated browser navigation — exercises proxy.ts's
    // cookie assignment and the page's trackPublicInvitationView() call
    // for real, not a seeded database row.
    await page.goto(`/invite/${event.slug}`);
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/analytics`);

    await expect(page.getByRole("heading", { name: "Analitik" })).toBeVisible();
    const totalViewsCard = page.getByText("Total Tayangan").locator("..");
    await expect(totalViewsCard.getByText("1", { exact: true })).toBeVisible();
    const uniqueVisitorsCard = page.getByText("Pengunjung Unik").locator("..");
    await expect(uniqueVisitorsCard.getByText("1", { exact: true })).toBeVisible();
  });

  test("a VIEWER-role member can read the analytics dashboard", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner-viewer");
    const viewer = await createAuthenticatedTestUser("viewer");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.userId, role: "VIEWER" },
    });

    await login(page, viewer.email);
    await page.goto(`/dashboard/events/${event.id}/analytics`);

    await expect(page.getByRole("heading", { name: "Analitik" })).toBeVisible();
    await expect(page.getByText("Belum ada tayangan.")).toBeVisible();
  });

  test("a stranger cannot access another owner's analytics dashboard", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner-stranger");
    const stranger = await createAuthenticatedTestUser("stranger");
    const event = await createTestEvent(owner.userId);

    await login(page, stranger.email);
    await page.goto(`/dashboard/events/${event.id}/analytics`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });

  test("an unauthenticated visitor is redirected to login when trying the dashboard URL directly", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner-unauth");
    const event = await createTestEvent(owner.userId);

    await page.goto(`/dashboard/events/${event.id}/analytics`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows safe empty-state copy for a brand-new event with no activity yet", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner-empty");
    const event = await createTestEvent(owner.userId);

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/analytics`);

    await expect(page.getByText("Belum ada tayangan.")).toBeVisible();
    await expect(page.getByText("Belum ada respons RSVP.")).toBeVisible();
    await expect(page.getByText("Belum ada ucapan.")).toBeVisible();
    await expect(page.getByText("Belum ada tamu yang check-in.")).toBeVisible();
    await expect(page.getByText("NaN")).toHaveCount(0);
    await expect(page.getByText("Infinity")).toHaveCount(0);
  });
});
