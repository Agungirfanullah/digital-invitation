import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * Drives a real authenticated session through the actual /login page,
 * using the admin-provisioning pattern from Phase 4 (docs/DECISIONS.md
 * D-022) — same as e2e/guests.spec.ts and e2e/editor.spec.ts.
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
  const email = `e2e-guest-invite-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Guest Invitation Test ${label}` },
  });

  return { email, userId: user.id };
}

async function createTestEvent(ownerId: string) {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Undangan E2E",
      slug: `e2e-guest-invite-${randomUUID()}`,
      status: "PUBLISHED",
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function createTestGuest(eventId: string) {
  const guest = await prisma.guest.create({
    data: {
      eventId,
      name: "Sinta Wulandari",
      normalizedName: "sinta wulandari",
      phone: "081234567890",
      seatQuota: 2,
    },
  });
  const invitation = await prisma.guestInvitation.create({
    data: { eventId, guestId: guest.id, token: `e2e-guest-invite-token-${randomUUID()}` },
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

test.describe("guest invitation delivery", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test("an owner sees personalized invitation controls, including copy link, regenerate, and message preview", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner");
    const event = await createTestEvent(owner.userId);
    const { guest } = await createTestGuest(event.id);

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/guests/${guest.id}/invitation`);

    await expect(page.getByRole("heading", { name: "Sinta Wulandari" })).toBeVisible();
    // Since Phase 8, the page also shows "Tamu ini belum mengisi RSVP."
    // as its own sentence when there's no answer yet — .first() keeps
    // this assertion about the status badge specifically.
    await expect(page.getByText("Belum Mengisi RSVP").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Salin Tautan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buat Ulang Tautan" })).toBeVisible();

    // The composed message personalizes guest name, event title, and URL.
    await expect(page.locator("pre")).toContainText("Halo Sinta Wulandari,");
    await expect(page.locator("pre")).toContainText("Pernikahan Undangan E2E");
    await expect(page.getByRole("button", { name: "Salin Pesan" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Buka WhatsApp" })).toBeVisible();

    // Roadmap Phase 13 — QR Invitation.
    await expect(page.getByText("QR Undangan", { exact: true })).toBeVisible();
    await expect(page.locator("svg[role='img']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Unduh QR" })).toBeVisible();
  });

  test("an editor sees the same personalized invitation controls", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner2");
    const editor = await createAuthenticatedTestUser("editor");
    const event = await createTestEvent(owner.userId);
    const { guest } = await createTestGuest(event.id);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: editor.userId, role: "EDITOR" },
    });

    await login(page, editor.email);
    await page.goto(`/dashboard/events/${event.id}/guests/${guest.id}/invitation`);

    await expect(page.getByRole("button", { name: "Salin Tautan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buat Ulang Tautan" })).toBeVisible();
    await expect(page.getByText("Pratinjau Pesan")).toBeVisible();

    // Roadmap Phase 13 — QR Invitation: EDITOR gets the same QR access as OWNER.
    await expect(page.getByText("QR Undangan", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unduh QR" })).toBeVisible();
  });

  test("a viewer sees invitation status/metadata but never the token, copy link, regenerate, or message preview", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner3");
    const viewer = await createAuthenticatedTestUser("viewer");
    const event = await createTestEvent(owner.userId);
    const { guest, invitation } = await createTestGuest(event.id);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.userId, role: "VIEWER" },
    });

    await login(page, viewer.email);
    await page.goto(`/dashboard/events/${event.id}/guests/${guest.id}/invitation`);

    await expect(page.getByRole("heading", { name: "Sinta Wulandari" })).toBeVisible();
    // Since Phase 8, the page also shows "Tamu ini belum mengisi RSVP."
    // as its own sentence when there's no answer yet — .first() keeps
    // this assertion about the status badge specifically.
    await expect(page.getByText("Belum Mengisi RSVP").first()).toBeVisible();
    await expect(page.getByText("Tautan pribadi tersedia untuk tamu ini")).toBeVisible();

    // The bearer token itself must never reach a VIEWER's page.
    await expect(page.getByText(invitation.token)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Salin Tautan" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Buat Ulang Tautan" })).toHaveCount(0);
    await expect(page.getByText("Pratinjau Pesan")).toHaveCount(0);

    // Roadmap Phase 13 — QR Invitation: a VIEWER must not receive the QR
    // (which itself encodes the token) or a download control for it.
    await expect(page.getByText("QR Undangan", { exact: true })).toHaveCount(0);
    await expect(page.locator("svg[role='img']")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Unduh QR" })).toHaveCount(0);
  });

  test("downloading the QR produces a real SVG file, and two different guests get visibly different QR content", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner6");
    const event = await createTestEvent(owner.userId);
    const { guest: guestOne } = await createTestGuest(event.id);
    const guestTwo = await prisma.guest.create({
      data: {
        eventId: event.id,
        name: "Rian Pratama",
        normalizedName: "rian pratama",
        seatQuota: 1,
      },
    });
    await prisma.guestInvitation.create({
      data: {
        eventId: event.id,
        guestId: guestTwo.id,
        token: `e2e-guest-invite-token-${randomUUID()}`,
      },
    });

    await login(page, owner.email);

    await page.goto(`/dashboard/events/${event.id}/guests/${guestOne.id}/invitation`);
    const svgOneContent = await page.locator("svg[role='img']").innerHTML();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Unduh QR" }).click();
    const download = await downloadPromise;

    // Filename is derived from the guest's own display name — see
    // lib/guests/qr-filename.ts — never from the raw token.
    expect(download.suggestedFilename()).toBe("qr-undangan-sinta-wulandari.svg");

    const downloadedPath = await download.path();
    expect(downloadedPath).toBeTruthy();
    const fs = await import("node:fs/promises");
    const fileContent = await fs.readFile(downloadedPath!, "utf-8");
    expect(fileContent).toContain("<svg");
    expect(fileContent).toContain("</svg>");
    expect(fileContent.length).toBeGreaterThan(200); // a real QR path, not an empty shell

    // A different guest (different encoded URL) renders visibly different
    // QR content — proves the QR is genuinely derived from the guest's
    // own link, without depending on qrcode.react's internal SVG path
    // format/library-specific details.
    await page.goto(`/dashboard/events/${event.id}/guests/${guestTwo.id}/invitation`);
    const svgTwoContent = await page.locator("svg[role='img']").innerHTML();
    expect(svgTwoContent).not.toBe(svgOneContent);
  });

  test("regenerating the token invalidates the old personalized link and the new one works", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner4");
    const event = await createTestEvent(owner.userId);
    const { guest } = await createTestGuest(event.id);

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/guests/${guest.id}/invitation`);

    const oldLink = (await page.locator("p.break-all").textContent())?.trim();
    expect(oldLink).toBeTruthy();

    await page.getByRole("button", { name: "Buat Ulang Tautan" }).click();
    await page.getByRole("button", { name: "Ya, buat ulang" }).click();
    await expect(page.getByText("Tautan baru berhasil dibuat.")).toBeVisible();

    const newLink = (await page.locator("p.break-all").textContent())?.trim();
    expect(newLink).toBeTruthy();
    expect(newLink).not.toBe(oldLink);

    // The invitation URL is built from NEXT_PUBLIC_APP_URL, which points
    // at a different port than the Playwright test server actually runs
    // on (see playwright.config.ts) — navigate by path, not the full
    // origin, so this test hits the server Playwright is driving.
    const oldPath = new URL(oldLink!).pathname + new URL(oldLink!).search;
    const newPath = new URL(newLink!).pathname + new URL(newLink!).search;

    // The old link no longer personalizes — falls back to a generic invitation.
    await page.goto(oldPath);
    await expect(page.getByText("Sinta Wulandari")).toHaveCount(0);

    // The new link personalizes correctly. The guest's name legitimately
    // appears twice (the greeting and the RSVP section's own "Halo ..."
    // prompt — see e2e/invitation.spec.ts's equivalent fix from Phase 6).
    await page.goto(newPath);
    await expect(page.getByText("Sinta Wulandari").first()).toBeVisible();
  });

  test("a stranger cannot access another owner's guest invitation page", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner5");
    const stranger = await createAuthenticatedTestUser("stranger");
    const event = await createTestEvent(owner.userId);
    const { guest } = await createTestGuest(event.id);

    await login(page, stranger.email);
    await page.goto(`/dashboard/events/${event.id}/guests/${guest.id}/invitation`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });
});
