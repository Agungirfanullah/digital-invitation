import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient, type EventType } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

/**
 * All eight MVP event types through the real stack (Phase 0.9): public
 * rendering from each type's own identity table, and the type-aware editor
 * reached through a real login and the real create-event form. Uses the
 * same admin-API authenticated-user approach as e2e/editor.spec.ts.
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
  const email = `e2e-types-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);
  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Types ${label}` },
  });
  return { email, userId: user.id };
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Seeds a published event of `type` with its own profile row and one schedule. */
async function createPublishedEvent(ownerId: string, type: EventType) {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type,
      title: `Acara Uji ${type}`,
      slug: `e2e-type-${type.toLowerCase()}-${randomUUID()}`,
      status: "PUBLISHED",
    },
  });
  createdEventIds.push(event.id);

  const eventId = event.id;
  switch (type) {
    case "WEDDING":
    case "ENGAGEMENT":
    case "ANNIVERSARY":
      await prisma.weddingProfile.create({
        data: {
          eventId,
          brideNickname: "Ayu",
          groomNickname: "Budi",
          yearsTogether: type === "ANNIVERSARY" ? 10 : null,
        },
      });
      break;
    case "BIRTHDAY":
      await prisma.personProfile.create({ data: { eventId, fullName: "Citra Anindya", age: 17 } });
      break;
    case "AQIQAH":
      await prisma.babyFamilyProfile.create({
        data: { eventId, babyFullName: "Rafa Alfarizi", fatherName: "Rizky", motherName: "Nadia" },
      });
      break;
    case "GATHERING":
      await prisma.hostProfile.create({ data: { eventId, hostName: "Keluarga Wiryo" } });
      break;
    case "CORPORATE":
      await prisma.organizationProfile.create({
        data: { eventId, organizationName: "PT Maju Bersama", dressCode: "Batik" },
      });
      break;
    case "OTHER":
      break;
  }

  await prisma.eventSchedule.create({
    data: {
      eventId,
      title: "Acara Utama",
      date: new Date("2026-12-12T00:00:00Z"),
      startTime: new Date("1970-01-01T10:00:00Z"),
      endTime: new Date("1970-01-01T12:00:00Z"),
    },
  });

  return event;
}

const EXPECTED: Record<EventType, { hero: string; identity: string | null }> = {
  WEDDING: { hero: "Ayu & Budi", identity: "Mempelai" },
  ENGAGEMENT: { hero: "Ayu & Budi", identity: "Calon Mempelai" },
  ANNIVERSARY: { hero: "Ayu & Budi", identity: "Pasangan" },
  BIRTHDAY: { hero: "Citra Anindya", identity: "Yang Berulang Tahun" },
  AQIQAH: { hero: "Rafa Alfarizi", identity: "Buah Hati Kami" },
  GATHERING: { hero: "Acara Uji GATHERING", identity: "Tuan Rumah" },
  CORPORATE: { hero: "Acara Uji CORPORATE", identity: "Penyelenggara" },
  OTHER: { hero: "Acara Uji OTHER", identity: null },
};

test.describe("all eight event types", () => {
  test.afterEach(async () => {
    if (createdEventIds.length) {
      await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
      createdEventIds.length = 0;
    }
    if (createdSupabaseUserIds.length) {
      // Also catches events created through the UI (not tracked by id).
      await prisma.event.deleteMany({ where: { ownerId: { in: createdSupabaseUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdSupabaseUserIds } } });
      for (const id of createdSupabaseUserIds) await admin.auth.admin.deleteUser(id);
      createdSupabaseUserIds.length = 0;
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("each type renders publicly with its own identity and terminology, without console errors", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("public");
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    for (const type of Object.keys(EXPECTED) as EventType[]) {
      const event = await createPublishedEvent(owner.userId, type);
      await page.goto(`/invite/${event.slug}`);

      await expect(
        page.getByRole("heading", { level: 1, name: EXPECTED[type].hero }),
      ).toBeVisible();
      const identity = EXPECTED[type].identity;
      if (identity) {
        await expect(page.getByRole("heading", { name: identity, exact: true })).toBeAttached();
      }
      if (type !== "WEDDING" && type !== "ENGAGEMENT") {
        await expect(page.getByText(/Mempelai|doa restu/)).toHaveCount(0);
      }
    }

    expect(consoleErrors).toEqual([]);
  });

  test("a Corporate event created through the real form gets a type-aware editor, section toggles and a locked type", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("corporate");
    await login(page, owner.email);

    await page.goto("/dashboard/events/new");
    await page.getByLabel("Judul acara").fill("Rapat Tahunan Uji");
    await page.getByLabel("Jenis acara").selectOption("CORPORATE");
    await page.getByLabel("Slug undangan").fill(`e2e-corp-${randomUUID().slice(0, 8)}`);
    await page.getByRole("button", { name: "Buat Acara" }).click();
    // Must not match the /dashboard/events/new form page we're still on.
    await expect(page).toHaveURL(/\/dashboard\/events\/(?!new$)[^/]+$/);
    const eventId = page.url().split("/").pop()!;
    const created = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    expect(created.type).toBe("CORPORATE");

    // Readiness checklist names what this type still needs.
    await expect(page.getByText("Nama organisasi")).toBeVisible();

    await page.goto(`/dashboard/events/${eventId}/editor`);
    const nav = page.getByRole("navigation", { name: "Bagian undangan" });
    await expect(nav.getByRole("button", { name: "Organisasi" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Mempelai" })).toHaveCount(0);

    await page.getByLabel("Nama organisasi / perusahaan").fill("PT Uji Coba");
    await expect(page.getByText("Perubahan tersimpan")).toBeVisible();
    const stored = await prisma.organizationProfile.findUnique({ where: { eventId } });
    expect(stored?.organizationName).toBe("PT Uji Coba");
    expect(await prisma.weddingProfile.count({ where: { eventId } })).toBe(0);

    // Owner turns RSVP off; the live preview drops it and the setting persists.
    await nav.getByRole("button", { name: "Bagian Undangan" }).click();
    const rsvpToggle = page.getByLabel("Konfirmasi Kehadiran (RSVP)", { exact: true });
    await expect(rsvpToggle).toBeChecked();
    await rsvpToggle.uncheck();
    await expect(rsvpToggle).not.toBeChecked();
    await expect(page.getByText(/RSVP hanya dapat diisi/)).toHaveCount(0);
    await expect
      .poll(async () => (await prisma.event.findUnique({ where: { id: eventId } }))?.settings)
      .toEqual({ sections: { rsvp: false } });

    // The type is shown read-only on the edit page.
    await page.goto(`/dashboard/events/${eventId}/edit`);
    await expect(
      page.getByText("Jenis acara tidak dapat diubah setelah acara dibuat."),
    ).toBeVisible();
    await expect(page.getByLabel("Jenis acara")).toHaveCount(0);
  });

  test("an OTHER event's editor offers no identity form at all", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("other");
    const event = await createPublishedEvent(owner.userId, "OTHER");
    await login(page, owner.email);

    await page.goto(`/dashboard/events/${event.id}/editor`);
    const nav = page.getByRole("navigation", { name: "Bagian undangan" });
    await expect(nav.getByRole("button", { name: "Jadwal Acara" })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Konten" })).toBeVisible();
    await expect(page.getByLabel("Nama panggilan")).toHaveCount(0);
    await expect(page.getByLabel("Nama lengkap")).toHaveCount(0);
  });
});
