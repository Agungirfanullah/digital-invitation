import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * Drives a real authenticated session through the actual /login page,
 * using the admin-provisioning pattern discovered in Phase 4 (see
 * docs/DECISIONS.md D-022) — `admin.auth.admin.createUser({ email_confirm:
 * true })` bypasses the Supabase DEV project's public-signup restriction
 * on synthetic email domains and produces an account that logs in through
 * the real UI like any other user.
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
  const email = `e2e-guests-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Guests Test ${label}` },
  });

  return { email, userId: user.id };
}

async function createTestEvent(ownerId: string) {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Tamu E2E",
      slug: `e2e-guests-${randomUUID()}`,
      status: "DRAFT",
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

test.describe("guest management", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test("unauthenticated users are redirected to login", async ({ page }) => {
    await page.goto("/dashboard/events/some-event-id/guests");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("owner can add a guest, see it appear, edit it, and have it persist after reload", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner");
    const event = await createTestEvent(owner.userId);

    await login(page, owner.email);

    await page.goto(`/dashboard/events/${event.id}/guests`);
    await expect(page.getByText("Belum ada tamu.")).toBeVisible();

    await page.getByRole("link", { name: "Tambah Tamu" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/guests/new$`));

    await page.getByLabel("Nama tamu").fill("Ayu Lestari");
    await page.getByLabel("Nomor telepon").fill("0812-3456-7890");
    await page.getByRole("button", { name: "Tambah Tamu" }).click();

    await expect(page).toHaveURL(new RegExp(`/guests$`));
    await expect(page.getByText("Ayu Lestari")).toBeVisible();

    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByLabel("Nama tamu").fill("Ayu Lestari Wijaya");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();

    await expect(page).toHaveURL(new RegExp(`/guests$`));
    await expect(page.getByText("Ayu Lestari Wijaya")).toBeVisible();

    // Persisted server-side, not just local state.
    await page.reload();
    await expect(page.getByText("Ayu Lestari Wijaya")).toBeVisible();
  });

  test("owner can delete a guest", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner2");
    const event = await createTestEvent(owner.userId);
    await prisma.guest.create({
      data: {
        eventId: event.id,
        name: "Citra Wulandari",
        normalizedName: "citra wulandari",
        invitations: { create: { eventId: event.id, token: randomUUID() } },
      },
    });

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/guests`);
    await expect(page.getByText("Citra Wulandari")).toBeVisible();

    // OWNER/EDITOR must see both the personalized-link and export controls (D-023).
    await expect(page.getByRole("button", { name: "Salin Tautan" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ekspor CSV" })).toBeVisible();

    await page.getByRole("button", { name: "Hapus" }).click();
    await page.getByRole("button", { name: "Ya, hapus" }).click();

    await expect(page.getByText("Belum ada tamu.")).toBeVisible();
  });

  test("a VIEWER-role member sees the guest list read-only, without mutation controls", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner3");
    const viewer = await createAuthenticatedTestUser("viewer");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.userId, role: "VIEWER" },
    });
    await prisma.guest.create({
      data: {
        eventId: event.id,
        name: "Dewi Kartika",
        normalizedName: "dewi kartika",
        invitations: { create: { eventId: event.id, token: randomUUID() } },
      },
    });

    await login(page, viewer.email);
    await page.goto(`/dashboard/events/${event.id}/guests`);

    await expect(page.getByText("Dewi Kartika")).toBeVisible();
    await expect(page.getByRole("link", { name: "Tambah Tamu" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Impor CSV" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Edit" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Hapus" })).toHaveCount(0);

    // Invitation tokens are a personalization secret — never surfaced to a VIEWER (D-023).
    await expect(page.getByRole("button", { name: "Salin Tautan" })).toHaveCount(0);

    // Export is VIEWER-and-above (D-023) — it must still be visible and reachable.
    await expect(page.getByRole("link", { name: "Ekspor CSV" })).toBeVisible();
  });

  test("an EDITOR-role member sees both the personalized-link and export controls", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner6");
    const editor = await createAuthenticatedTestUser("editor");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: editor.userId, role: "EDITOR" },
    });
    await prisma.guest.create({
      data: {
        eventId: event.id,
        name: "Farhan Maulana",
        normalizedName: "farhan maulana",
        invitations: { create: { eventId: event.id, token: randomUUID() } },
      },
    });

    await login(page, editor.email);
    await page.goto(`/dashboard/events/${event.id}/guests`);

    await expect(page.getByText("Farhan Maulana")).toBeVisible();
    await expect(page.getByRole("button", { name: "Salin Tautan" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ekspor CSV" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tambah Tamu" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();
  });

  test("a VIEWER-role member cannot reach the create-guest page directly", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner4");
    const viewer = await createAuthenticatedTestUser("viewer2");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.userId, role: "VIEWER" },
    });

    await login(page, viewer.email);
    await page.goto(`/dashboard/events/${event.id}/guests/new`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });

  test("a stranger cannot access another owner's guest list", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner5");
    const stranger = await createAuthenticatedTestUser("stranger");
    const event = await createTestEvent(owner.userId);

    await login(page, stranger.email);
    await page.goto(`/dashboard/events/${event.id}/guests`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });
});
