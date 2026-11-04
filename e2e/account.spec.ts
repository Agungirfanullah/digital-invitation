import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

/**
 * The Akun page: renaming, changing the password (the current one is
 * checked), and deleting the account with everything it owns. Every user
 * and event made here is removed in `afterEach`, also when a test deletes
 * the account itself (the deletes are then no-ops).
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const TEST_PASSWORD = "Test-Password-123!";
const NEW_PASSWORD = "Ganti-Sandi-456!";

const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

async function createUser(label: string) {
  const email = `e2e-account-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdUserIds.push(data.user.id);
  await prisma.user.create({ data: { id: data.user.id, email, name: `E2E Akun ${label}` } });
  return { email, userId: data.user.id };
}

async function login(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("account page", () => {
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

  test("an owner renames themselves and changes their password, checked against the current one", async ({
    page,
  }) => {
    const { email, userId } = await createUser("profile");
    await login(page, email);

    await page.getByRole("link", { name: "Akun", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Akun" })).toBeVisible();

    await page.getByLabel("Nama", { exact: true }).fill("Citra Pratama");
    await page.getByRole("button", { name: "Simpan Nama" }).click();
    await expect(page.getByText("Nama berhasil diperbarui.")).toBeVisible();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).name).toBe(
      "Citra Pratama",
    );

    // A wrong current password is refused.
    await page.getByLabel("Kata sandi saat ini").fill("salah-sandi-1");
    await page.getByLabel("Kata sandi baru", { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel("Ulangi kata sandi baru").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Ganti Kata Sandi" }).click();
    await expect(page.getByText("Kata sandi saat ini salah.")).toBeVisible();

    await page.getByLabel("Kata sandi saat ini").fill(TEST_PASSWORD);
    await page.getByLabel("Kata sandi baru", { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel("Ulangi kata sandi baru").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Ganti Kata Sandi" }).click();
    await expect(page.getByText("Kata sandi berhasil diganti.")).toBeVisible();

    // The new password works for a fresh login.
    await page.context().clearCookies();
    await login(page, email, NEW_PASSWORD);
  });

  test("an owner deletes their account; their events and login are gone", async ({ page }) => {
    const { email, userId } = await createUser("delete");
    const event = await prisma.event.create({
      data: {
        ownerId: userId,
        type: "WEDDING",
        title: "Acara Akan Terhapus",
        slug: `e2e-account-${randomUUID()}`,
        status: "PUBLISHED",
      },
    });
    createdEventIds.push(event.id);
    await prisma.guest.create({
      data: { eventId: event.id, name: "Tamu Terhapus", normalizedName: "tamu terhapus" },
    });

    await login(page, email);
    await page.goto("/dashboard/account");
    await page.getByRole("button", { name: "Hapus Akun" }).click();
    await expect(
      page.getByText("1 acara milikmu beserta tamu, RSVP, ucapan, dan foto"),
    ).toBeVisible();

    // The confirmation has to match the account's own email.
    await page.getByLabel(/untuk konfirmasi/).fill("orang-lain@example.com");
    await page.getByRole("button", { name: "Hapus Akun Permanen" }).click();
    await expect(page.getByText("Email tidak cocok dengan email akunmu.")).toBeVisible();

    await page.getByLabel(/untuk konfirmasi/).fill(email);
    await page.getByRole("button", { name: "Hapus Akun Permanen" }).click();
    await expect(page).toHaveURL(/\/login\?account=deleted/);
    await expect(page.getByText(/Akunmu dan semua datanya sudah dihapus/)).toBeVisible();

    expect(await prisma.user.findUnique({ where: { id: userId } })).toBeNull();
    expect(await prisma.event.findUnique({ where: { id: event.id } })).toBeNull();
    expect(await prisma.guest.count({ where: { eventId: event.id } })).toBe(0);
    const { data } = await admin.auth.admin.getUserById(userId);
    expect(data.user).toBeNull();

    // The deleted login no longer works.
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
