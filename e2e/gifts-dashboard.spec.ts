import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * The authenticated gift-method dashboard requires a real login — same
 * admin-provisioning pattern as e2e/guests.spec.ts and
 * e2e/rsvp-dashboard.spec.ts (docs/DECISIONS.md D-022).
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
  const email = `e2e-gifts-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Gifts Test ${label}` },
  });

  return { email, userId: user.id };
}

async function createTestEvent(ownerId: string, status: "DRAFT" | "PUBLISHED" = "DRAFT") {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Hadiah E2E",
      slug: `e2e-gifts-${randomUUID()}`,
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
  if (createdSupabaseUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdSupabaseUserIds } } });
    for (const id of createdSupabaseUserIds) {
      await admin.auth.admin.deleteUser(id);
    }
    createdSupabaseUserIds.length = 0;
  }
  await prisma.$disconnect();
}

test.describe("gift method dashboard", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test("an owner can create, edit, and delete a gift method", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner");
    const event = await createTestEvent(owner.userId);

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/gifts`);
    await expect(page.getByText("Belum ada metode hadiah.")).toBeVisible();

    // The empty state's own "Tambah Metode" CTA duplicates the header
    // button while the list is empty — .first() targets the header one.
    await page.getByRole("link", { name: "Tambah Metode" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/gifts/new$`));
    await page.getByLabel("Nama Bank").fill("Bank Contoh");
    await page.getByLabel("Nama Pemilik Rekening").fill("Budi Santoso");
    await page.getByLabel("Nomor Rekening").fill("1234567890");
    await page.getByRole("button", { name: "Tambah Metode" }).click();

    await expect(page).toHaveURL(new RegExp(`/gifts$`));
    await expect(page.getByText("Bank Contoh")).toBeVisible();
    await expect(page.getByText("Transfer Bank")).toBeVisible();
    await expect(page.getByText("1234567890")).toBeVisible();

    await page.getByRole("link", { name: "Edit" }).click();
    await expect(page.getByLabel("Nama Bank")).toHaveValue("Bank Contoh");
    await page.getByLabel("Nama Bank").fill("Bank Baru");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();

    await expect(page).toHaveURL(new RegExp(`/gifts$`));
    await expect(page.getByText("Bank Baru")).toBeVisible();
    await expect(page.getByText("Bank Contoh")).toHaveCount(0);

    await page.getByRole("button", { name: "Hapus" }).click();
    await page.getByRole("button", { name: "Ya, hapus" }).click();
    await expect(page.getByText("Belum ada metode hadiah.")).toBeVisible();
  });

  test("an editor can create a gift method", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner2");
    const editor = await createAuthenticatedTestUser("editor");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: editor.userId, role: "EDITOR" },
    });

    await login(page, editor.email);
    await page.goto(`/dashboard/events/${event.id}/gifts/new`);
    await page.locator("#type").selectOption("OTHER");
    await page.getByLabel("Judul", { exact: false }).fill("Alamat Pengiriman Kado");
    await page.getByLabel("Instruksi atau Alamat Pengiriman").fill("Jl. Contoh No. 1, Jakarta");
    await page.getByRole("button", { name: "Tambah Metode" }).click();

    await expect(page).toHaveURL(new RegExp(`/gifts$`));
    await expect(page.getByText("Alamat Pengiriman Kado")).toBeVisible();
    await expect(page.getByText("Lainnya")).toBeVisible();
  });

  test("a viewer sees a read-only gift method list", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner3");
    const viewer = await createAuthenticatedTestUser("viewer");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.userId, role: "VIEWER" },
    });
    await prisma.giftMethod.create({
      data: {
        eventId: event.id,
        type: "BANK",
        providerName: "Bank Contoh",
        accountNumber: "1234567890",
      },
    });

    await login(page, viewer.email);
    await page.goto(`/dashboard/events/${event.id}/gifts`);

    await expect(page.getByText("Bank Contoh")).toBeVisible();
    await expect(page.getByRole("link", { name: "Tambah Metode" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Edit" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Hapus" })).toHaveCount(0);
  });

  test("a stranger cannot access another owner's gift method dashboard", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner4");
    const stranger = await createAuthenticatedTestUser("stranger");
    const event = await createTestEvent(owner.userId);

    await login(page, stranger.email);
    await page.goto(`/dashboard/events/${event.id}/gifts`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });

  test("the public invitation displays a configured, active gift method with a copy action", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner5");
    const event = await createTestEvent(owner.userId, "PUBLISHED");
    await prisma.giftMethod.create({
      data: {
        eventId: event.id,
        type: "BANK",
        providerName: "Bank Contoh",
        accountName: "Budi Santoso",
        accountNumber: "1234567890",
        isActive: true,
      },
    });

    await page.goto(`/invite/${event.slug}`);

    await expect(page.getByRole("heading", { name: "Kirim Hadiah" })).toBeVisible();
    await expect(page.getByText("Bank Contoh")).toBeVisible();
    await expect(page.getByText("1234567890")).toBeVisible();
    await expect(page.getByRole("button", { name: /Salin Nomor/ })).toBeVisible();
  });

  test("the public invitation hides the gift section entirely when no gift methods are configured", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner6");
    const event = await createTestEvent(owner.userId, "PUBLISHED");

    await page.goto(`/invite/${event.slug}`);
    await expect(page.getByRole("heading", { name: "Kirim Hadiah" })).toHaveCount(0);
  });

  test("an inactive gift method is not shown on the public invitation", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner7");
    const event = await createTestEvent(owner.userId, "PUBLISHED");
    await prisma.giftMethod.create({
      data: {
        eventId: event.id,
        type: "BANK",
        providerName: "Bank Nonaktif",
        accountNumber: "999",
        isActive: false,
      },
    });

    await page.goto(`/invite/${event.slug}`);
    await expect(page.getByRole("heading", { name: "Kirim Hadiah" })).toHaveCount(0);
    await expect(page.getByText("Bank Nonaktif")).toHaveCount(0);
  });
});
