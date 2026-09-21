import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * The check-in dashboard is a real, authenticated login (admin-provisioned,
 * same pattern as e2e/wishes.spec.ts / e2e/rsvp-dashboard.spec.ts). There is
 * no unauthenticated half to this feature (unlike wishes/RSVP) — check-in is
 * staff-only, never guest-facing.
 *
 * The QR camera-scanning path cannot be verified end-to-end here: headless
 * Chromium in this environment has no video input device, so
 * `QrScanner.hasCamera()` resolves false and the scanner renders its
 * "no camera detected" state — which is itself the correct, intended
 * behavior for a device without a camera, and is what gets asserted below.
 * This does NOT verify actual camera decoding on real hardware; see
 * docs/STATUS.md's Phase 14 entry for the honest mobile-verification status.
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
  const email = `e2e-checkin-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Check-in Test ${label}` },
  });

  return { email, userId: user.id };
}

async function createTestEvent(ownerId: string) {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Check-in E2E",
      slug: `e2e-checkin-${randomUUID()}`,
      status: "DRAFT",
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function createTestGuest(eventId: string, name: string) {
  const guest = await prisma.guest.create({
    data: { eventId, name, normalizedName: name.toLowerCase(), seatQuota: 2 },
  });
  const invitation = await prisma.guestInvitation.create({
    data: { eventId, guestId: guest.id, token: `e2e-checkin-token-${randomUUID()}` },
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

test.describe("check-in", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("a stranger cannot access another owner's check-in dashboard", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner-stranger");
    const stranger = await createAuthenticatedTestUser("stranger");
    const event = await createTestEvent(owner.userId);

    await login(page, stranger.email);
    await page.goto(`/dashboard/events/${event.id}/check-in`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });

  test("the QR scanner shows a no-camera state in this headless environment, and manual search is always available as a fallback", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner-scanner");
    const event = await createTestEvent(owner.userId);

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/check-in`);

    await page.getByRole("button", { name: "Mulai Pindai" }).click();
    await expect(page.getByText(/Tidak ada kamera|Izin kamera ditolak/).first()).toBeVisible();

    await page.getByRole("button", { name: "Cari Manual" }).click();
    await expect(page.getByPlaceholder("Cari nama tamu...")).toBeVisible();
  });

  // One combined test — each step depends on the previous mutation
  // (search → preview → confirm → duplicate attempt), mirroring
  // e2e/wishes.spec.ts's justification for not splitting these up.
  test("an owner can find a guest by manual search, check them in, and a repeat search shows the guest is already checked in", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner-manual");
    const event = await createTestEvent(owner.userId);
    const { guest } = await createTestGuest(event.id, "Rian Saputra");

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/check-in`);
    await expect(page.getByText("Belum Check-in").first()).toBeVisible();

    await page.getByRole("button", { name: "Cari Manual" }).click();
    await page.getByPlaceholder("Cari nama tamu...").fill("Rian");
    const resultRow = page.getByText("Rian Saputra", { exact: true });
    await expect(resultRow).toBeVisible();
    await page.getByRole("button", { name: "Pilih" }).click();

    await expect(page.getByText("Rian Saputra", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Konfirmasi Check-in" }).click();
    await expect(page.getByText("Berhasil check-in")).toBeVisible();

    await page.getByRole("button", { name: "Pindai / Cari Tamu Lain" }).click();
    await page.getByRole("button", { name: "Cari Manual" }).click();
    await page.getByPlaceholder("Cari nama tamu...").fill("Rian");
    await page.getByRole("button", { name: "Pilih" }).click();

    // The preview itself already reflects the guest's real check-in state
    // (isCheckedIn: true), so the shell never even offers a confirm action
    // for a guest who is already checked in — only "Batal" to back out.
    await expect(page.getByText("Sudah Check-in", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Konfirmasi Check-in" })).toHaveCount(0);
    await page.getByRole("button", { name: "Batal" }).click();

    const stored = await prisma.checkIn.findUnique({
      where: { eventId_guestId: { eventId: event.id, guestId: guest.id } },
    });
    expect(stored?.method).toBe("MANUAL");
    expect(await prisma.checkIn.count({ where: { eventId: event.id, guestId: guest.id } })).toBe(1);
  });

  test("a VIEWER-role member can search and see guest details but has no way to confirm a check-in", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner-viewer");
    const viewer = await createAuthenticatedTestUser("viewer");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.userId, role: "VIEWER" },
    });
    const { guest } = await createTestGuest(event.id, "Sari Wulandari");

    await login(page, viewer.email);
    await page.goto(`/dashboard/events/${event.id}/check-in`);
    await expect(page.getByText("Anda memiliki akses lihat-saja untuk acara ini.")).toBeVisible();

    await page.getByRole("button", { name: "Cari Manual" }).click();
    await page.getByPlaceholder("Cari nama tamu...").fill("Sari");
    await expect(page.getByText("Sari Wulandari", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Pilih" }).click();

    await expect(page.getByText("Sari Wulandari", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Konfirmasi Check-in" })).toHaveCount(0);

    expect(await prisma.checkIn.count({ where: { eventId: event.id, guestId: guest.id } })).toBe(0);
  });

  test("mobile viewport (390x844): the check-in page renders without horizontal overflow", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner-mobile");
    const event = await createTestEvent(owner.userId);
    await createTestGuest(event.id, "Tono Wijaya");

    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/check-in`);

    await expect(page.getByRole("heading", { name: "Check-in Tamu" })).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
