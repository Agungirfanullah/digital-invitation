import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

/**
 * The admin panel (D-107): only ADMIN accounts get in (others see a 404),
 * and an admin can suspend and reinstate a user, take an invitation
 * offline, and delete an event. Everything made here is removed in
 * `afterEach`.
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const TEST_PASSWORD = "Test-Password-123!";
const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

async function createUser(label: string, role: "USER" | "ADMIN" = "USER") {
  const email = `e2e-admin-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdUserIds.push(data.user.id);
  await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Admin ${label}`, role },
  });
  return { email, userId: data.user.id };
}

async function submitLogin(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
}

test.describe("admin panel", () => {
  test.afterEach(async () => {
    if (createdEventIds.length) {
      await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
      createdEventIds.length = 0;
    }
    if (createdUserIds.length) {
      await prisma.auditLog.deleteMany({
        where: {
          OR: [{ userId: { in: createdUserIds } }, { resourceId: { in: createdUserIds } }],
        },
      });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      for (const id of createdUserIds) await admin.auth.admin.deleteUser(id);
      createdUserIds.length = 0;
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("a regular user cannot open the admin panel and does not see it in the menu", async ({
    page,
  }) => {
    const { email } = await createUser("regular");
    await submitLogin(page, email);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("link", { name: "Admin", exact: true })).toHaveCount(0);

    // The dashboard streams (it has a loading state), so the page answers
    // 200 and renders the not-found screen instead of the panel.
    await page.goto("/dashboard/admin");
    await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
    await expect(page.getByText("Mode admin")).toHaveCount(0);
  });

  test("an admin suspends a user, who then cannot sign in, and reinstates them", async ({
    browser,
    page,
  }) => {
    const boss = await createUser("boss", "ADMIN");
    const target = await createUser("target");

    await submitLogin(page, boss.email);
    await page.getByRole("link", { name: "Admin", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Admin" })).toBeVisible();

    await page.getByRole("link", { name: "Pengguna", exact: true }).click();
    await page.getByLabel("Cari").fill(target.email);
    await page.getByRole("button", { name: "Cari" }).click();
    await page.getByRole("link", { name: "E2E Admin target" }).click();

    await page.getByRole("button", { name: "Nonaktifkan akun" }).click();
    await expect(page.getByText("Akun dinonaktifkan.")).toBeVisible();
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: target.userId } })).suspendedAt,
    ).not.toBeNull();

    const other = await browser.newPage();
    await submitLogin(other, target.email);
    await expect(other.getByText(/Akun ini sedang dinonaktifkan/)).toBeVisible();
    await expect(other).toHaveURL(/\/login/);

    await page.getByRole("button", { name: "Aktifkan kembali akun" }).click();
    await expect(page.getByText("Akun diaktifkan kembali.")).toBeVisible();
    await submitLogin(other, target.email);
    await expect(other).toHaveURL(/\/dashboard$/);
    await other.close();

    const audit = await prisma.auditLog.findMany({
      where: { userId: boss.userId, resourceId: target.userId },
      orderBy: { createdAt: "asc" },
      select: { action: true },
    });
    expect(audit.map((row) => row.action)).toEqual(["admin.suspend_user", "admin.unsuspend_user"]);
  });

  test("an admin takes an invitation offline, then deletes the event", async ({ page }) => {
    const boss = await createUser("events-boss", "ADMIN");
    const owner = await createUser("events-owner");
    const event = await prisma.event.create({
      data: {
        ownerId: owner.userId,
        type: "WEDDING",
        title: `Acara Laporan ${randomUUID().slice(0, 6)}`,
        slug: `e2e-admin-${randomUUID()}`,
        status: "PUBLISHED",
      },
    });
    createdEventIds.push(event.id);

    await submitLogin(page, boss.email);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto(`/dashboard/admin/events?q=${event.slug}`);
    const row = page.locator("tr", { hasText: event.title });
    await row.getByRole("button", { name: "Batalkan publikasi" }).click();
    await expect(page.getByText("Undangan tidak lagi dipublikasikan.")).toBeVisible();
    expect((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).status).toBe(
      "DRAFT",
    );

    await row.getByRole("button", { name: "Hapus", exact: true }).click();
    await row.getByRole("button", { name: `Ya, hapus ${event.title}` }).click();
    await expect(page.getByText("Tidak ada acara yang cocok.")).toBeVisible();
    expect(await prisma.event.findUnique({ where: { id: event.id } })).toBeNull();
  });
});
