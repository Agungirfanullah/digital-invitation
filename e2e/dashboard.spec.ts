import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * Dashboard shell: the Beranda overview, the searchable Undangan list, and
 * the event hub's publish switch. Real login + real DB rows, same pattern
 * as e2e/analytics.spec.ts.
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const TEST_PASSWORD = "Test-Password-123!";

const createdSupabaseUserIds: string[] = [];
const createdEventIds: string[] = [];

async function createAuthenticatedTestUser(label: string) {
  const email = `e2e-dashboard-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Dashboard ${label}` },
  });
  return { email, userId: user.id };
}

async function createEvent(ownerId: string, title: string, status: "DRAFT" | "PUBLISHED") {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title,
      slug: `e2e-dashboard-${randomUUID()}`,
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

test.describe("dashboard", () => {
  test.afterEach(async () => {
    if (createdEventIds.length) {
      await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
      createdEventIds.length = 0;
    }
    if (createdSupabaseUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdSupabaseUserIds } } });
      for (const id of createdSupabaseUserIds) await admin.auth.admin.deleteUser(id);
      createdSupabaseUserIds.length = 0;
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("a new user sees the empty state and no check-in shortcut", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("empty");
    await login(page, owner.email);

    await expect(page.getByText("Belum ada acara.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Check-in Tamu/ })).toHaveCount(0);
  });

  test("the Undangan list filters by search and shows a useful empty result", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("search");
    await createEvent(owner.userId, "Pernikahan Andi dan Sari", "PUBLISHED");
    await createEvent(owner.userId, "Ulang Tahun Budi", "DRAFT");
    await login(page, owner.email);

    await page.getByRole("link", { name: "Undangan", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/events$/);
    await expect(page.getByRole("heading", { name: "Pernikahan Andi dan Sari" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ulang Tahun Budi" })).toBeVisible();

    await page.getByLabel("Cari undangan").fill("budi");
    await page.getByRole("button", { name: "Cari" }).click();
    await expect(page).toHaveURL(/q=budi/);
    await expect(page.getByRole("heading", { name: "Ulang Tahun Budi" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pernikahan Andi dan Sari" })).toHaveCount(0);

    await page.getByLabel("Cari undangan").fill("tidak-ada-yang-cocok");
    await page.getByRole("button", { name: "Cari" }).click();
    await expect(page.getByText("Tidak ada undangan yang cocok.")).toBeVisible();
  });

  test("Kelola opens the event hub; a draft that isn't ready can't be switched on and says why", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("hub");
    await createEvent(owner.userId, "Acara Belum Siap", "DRAFT");
    await login(page, owner.email);

    await page.getByRole("link", { name: "Kelola" }).click();
    await expect(page.getByRole("heading", { name: "Acara Belum Siap" })).toBeVisible();

    const toggle = page.getByRole("switch", { name: "Publikasikan undangan" });
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await expect(page.getByText("Lengkapi dulu sebelum dipublikasikan:")).toBeVisible();

    await toggle.click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  test("a published event shows as active and can be switched off", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("unpublish");
    const event = await createEvent(owner.userId, "Acara Sudah Terbit", "PUBLISHED");
    await login(page, owner.email);

    await page.goto(`/dashboard/events/${event.id}`);
    const toggle = page.getByRole("switch", { name: "Publikasikan undangan" });
    await expect(toggle).toHaveAttribute("aria-checked", "true");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    const saved = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(saved.status).toBe("DRAFT");
  });
});
