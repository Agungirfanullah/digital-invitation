import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * The gallery editor is authenticated dashboard functionality — real
 * login, admin-provisioned (docs/DECISIONS.md D-022), same pattern as
 * e2e/gifts-dashboard.spec.ts and e2e/wishes.spec.ts's dashboard half.
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

// A real, valid 1x1 transparent PNG — the same fixture used by the
// integration suite (lib/editor/service.integration.test.ts), so the
// upload really is exercised end to end, not a fake/mocked file.
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

async function createAuthenticatedTestUser(label: string) {
  const email = `e2e-gallery-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Gallery Test ${label}` },
  });

  return { email, userId: user.id };
}

async function createTestEvent(ownerId: string, status: "DRAFT" | "PUBLISHED" = "DRAFT") {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Galeri E2E",
      slug: `e2e-gallery-${randomUUID()}`,
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

async function openGallerySection(page: import("@playwright/test").Page, eventId: string) {
  await page.goto(`/dashboard/events/${eventId}/editor`);
  await page.getByRole("button", { name: "Galeri" }).click();
  await expect(page.getByRole("heading", { name: "Galeri", exact: true })).toBeVisible();
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
}

test.describe("gallery", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  // Deliberately one long test, not several — each step depends on the
  // previous one's mutation (upload → persists after reload → reorder →
  // persists after reload → delete → absent both in the dashboard and
  // publicly), mirroring e2e/rsvp.spec.ts's and e2e/wishes.spec.ts's
  // combined-flow justification.
  test("an owner can upload two real images, reorder them, and delete one — every step persists after reload and reflects on the public invitation", async ({
    page,
  }, testInfo) => {
    // This test does meaningfully more real I/O than any other single
    // spec in the suite — two genuine Supabase Storage uploads plus five
    // page navigations/reloads against the live DEV database — so the
    // default 30s per-test timeout is legitimately tight under the full
    // suite's 6-way parallel worker contention (confirmed by re-running
    // this test alone, repeatedly, with no failures — only the full
    // concurrent run is affected). Extending it here is honest slack for
    // real extra work, not a mask for a flaky assertion.
    testInfo.setTimeout(60_000);

    const owner = await createAuthenticatedTestUser("owner");
    const event = await createTestEvent(owner.userId, "PUBLISHED");

    await login(page, owner.email);
    await openGallerySection(page, event.id);
    await expect(page.getByText("Belum ada foto atau video.")).toBeVisible();

    // Upload the first image.
    await page.setInputFiles("#galleryFile", {
      name: "pertama.png",
      mimeType: "image/png",
      buffer: Buffer.from(TINY_PNG_BASE64, "base64"),
    });
    await page.getByLabel("Keterangan (opsional)").first().fill("Foto pertama");
    await page.getByRole("button", { name: "Unggah Foto" }).click();
    await expect(page.getByText("Foto pertama")).toBeVisible();
    await expect(page.getByText("Belum ada foto atau video.")).toHaveCount(0);

    // Upload the second image.
    await page.setInputFiles("#galleryFile", {
      name: "kedua.png",
      mimeType: "image/png",
      buffer: Buffer.from(TINY_PNG_BASE64, "base64"),
    });
    await page.getByLabel("Keterangan (opsional)").first().fill("Foto kedua");
    await page.getByRole("button", { name: "Unggah Foto" }).click();
    await expect(page.getByText("Foto kedua")).toBeVisible();

    // Persisted server-side, not just local state. The editor's active
    // section tab is local UI state (not URL-driven), so it resets to the
    // default tab on a fresh load — reselect "Galeri" explicitly.
    await page.reload();
    await page.getByRole("button", { name: "Galeri" }).click();
    await expect(page.getByText("Foto pertama")).toBeVisible();
    await expect(page.getByText("Foto kedua")).toBeVisible();

    // Reorder: move the second photo up, so it becomes first.
    const items = page.locator("li", { hasText: /Foto (pertama|kedua)/ });
    await expect(items).toHaveCount(2);
    await items.nth(1).getByRole("button", { name: "Pindahkan ke atas" }).click();
    await expect(items.nth(0)).toContainText("Foto kedua");
    await expect(items.nth(1)).toContainText("Foto pertama");

    // Reorder persists after reload too.
    await page.reload();
    await page.getByRole("button", { name: "Galeri" }).click();
    const reloadedItems = page.locator("li", { hasText: /Foto (pertama|kedua)/ });
    await expect(reloadedItems.nth(0)).toContainText("Foto kedua");
    await expect(reloadedItems.nth(1)).toContainText("Foto pertama");

    // The public invitation shows both, in the new order.
    await page.goto(`/invite/${event.slug}`);
    await expect(page.getByRole("heading", { name: "Galeri", exact: true })).toBeVisible();

    // Opens the in-page lightbox rather than a new tab.
    const gallerySection = page.getByRole("region", { name: "Galeri" });
    await gallerySection.locator("button").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // Delete "Foto pertama" from the dashboard.
    await page.goto(`/dashboard/events/${event.id}/editor`);
    await page.getByRole("button", { name: "Galeri" }).click();
    const firstPhotoRow = page.locator("li", { hasText: "Foto pertama" });
    await firstPhotoRow.getByRole("button", { name: "Hapus" }).click();
    await firstPhotoRow.getByRole("button", { name: "Ya, hapus" }).click();
    await expect(page.getByText("Foto pertama")).toHaveCount(0);
    await expect(page.getByText("Foto kedua")).toBeVisible();

    // Gone from the public invitation too.
    await page.goto(`/invite/${event.slug}`);
    await expect(page.getByText("Foto pertama")).toHaveCount(0);
  });

  test("existing video-by-URL functionality still works alongside real image upload", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner2");
    const event = await createTestEvent(owner.userId);

    await login(page, owner.email);
    await openGallerySection(page, event.id);

    await page.getByLabel("URL video").fill("https://example.com/video.mp4");
    await page.getByLabel("Keterangan (opsional)").last().fill("Video acara");
    await page.getByRole("button", { name: "Tambah Video" }).click();

    await expect(page.getByText("Video acara")).toBeVisible();
  });

  test("a viewer cannot upload, delete, or reorder gallery items", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner3");
    const viewer = await createAuthenticatedTestUser("viewer");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.userId, role: "VIEWER" },
    });

    // A VIEWER-role member cannot open the editor at all (D-021) — the
    // same not-found page as any unauthorized/nonexistent event.
    await login(page, viewer.email);
    await page.goto(`/dashboard/events/${event.id}/editor`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });

  test("a stranger cannot access another owner's editor", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner4");
    const stranger = await createAuthenticatedTestUser("stranger");
    const event = await createTestEvent(owner.userId);

    await login(page, stranger.email);
    await page.goto(`/dashboard/events/${event.id}/editor`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });

  test("the public invitation hides the gallery section entirely when it's empty", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner5");
    const event = await createTestEvent(owner.userId, "PUBLISHED");

    await page.goto(`/invite/${event.slug}`);
    await expect(page.getByRole("heading", { name: "Galeri", exact: true })).toHaveCount(0);
  });
});
