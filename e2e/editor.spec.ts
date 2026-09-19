import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * Unlike e2e/auth.spec.ts and e2e/events.spec.ts, this suite drives a
 * REAL authenticated session through the actual /login page — no cookie
 * hacking. Phase 2/3 documented that a full authenticated browser flow
 * couldn't be automated because Supabase Auth's public signup rejects
 * synthetic email domains. That restriction is specific to
 * `auth.signUp()`; the *admin* API's `createUser({ email_confirm: true })`
 * bypasses it entirely and produces an account that can sign in through
 * the normal password-login flow like any real user. This is a real
 * finding worth carrying forward: future phases needing an authenticated
 * E2E flow are not blocked by the Phase 2 limitation the way it was
 * originally framed.
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
  const email = `e2e-editor-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Editor Test ${label}` },
  });

  return { email, userId: user.id };
}

async function createTestEvent(ownerId: string) {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Editor E2E",
      slug: `e2e-editor-${randomUUID()}`,
      status: "PUBLISHED",
    },
  });
  createdEventIds.push(event.id);

  await prisma.weddingProfile.create({
    data: { eventId: event.id, brideNickname: "Ayu", groomNickname: "Budi" },
  });

  return event;
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

test.describe("invitation editor", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test("unauthenticated users are redirected to login", async ({ page }) => {
    await page.goto("/dashboard/events/some-event-id/editor");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("owner can load the editor, see real data, edit a field, and have it persist", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner");
    const event = await createTestEvent(owner.userId);

    // Real login through the actual UI — no manual cookie injection.
    await page.goto("/login");
    await page.getByLabel("Email").fill(owner.email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/dashboard/events/${event.id}/editor`);
    // Both the form and the live preview render a "Mempelai" heading.
    await expect(page.getByRole("heading", { name: "Mempelai" }).first()).toBeVisible();

    // Real persisted data loaded into the form.
    const brideNickname = page.getByLabel("Nama panggilan").first();
    await expect(brideNickname).toHaveValue("Ayu");

    // Edit triggers debounced autosave.
    const groomNickname = page.getByLabel("Nama panggilan").nth(1);
    await groomNickname.fill("Budi Baru");
    await expect(page.getByText("Menyimpan...")).toBeVisible();
    await expect(page.getByText("Perubahan tersimpan")).toBeVisible({ timeout: 10_000 });

    // Reload — persisted server state, not just local state.
    await page.reload();
    await expect(page.getByLabel("Nama panggilan").nth(1)).toHaveValue("Budi Baru");

    // The live preview reuses the real InvitationRenderer and reflects it too.
    await expect(page.getByText("Ayu & Budi Baru")).toBeVisible();
  });

  test("editing a field and viewing the public invitation reflects the saved change", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner2");
    const event = await createTestEvent(owner.userId);

    await page.goto("/login");
    await page.getByLabel("Email").fill(owner.email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/dashboard/events/${event.id}/editor`);
    await page.getByLabel("Nama panggilan").first().fill("Ayu Ganti");
    await expect(page.getByText("Perubahan tersimpan")).toBeVisible({ timeout: 10_000 });

    await page.goto(`/invite/${event.slug}`);
    await expect(page.getByText("Ayu Ganti & Budi")).toBeVisible();
  });

  test("a VIEWER-role member cannot open the editor", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner3");
    const viewer = await createAuthenticatedTestUser("viewer");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.userId, role: "VIEWER" },
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill(viewer.email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/dashboard/events/${event.id}/editor`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });
});
