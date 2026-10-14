import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient, type EventType } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

import { revealInvitation } from "./reveal-invitation";

/**
 * Identity photos (D-091): the owner uploads a photo of the bride and groom,
 * or of the celebrant/baby, in the editor; it is stored on the profile and
 * shown on the public invitation. Real login (admin-provisioned, D-022) and
 * real Storage uploads against the DEV project; every uploaded object is
 * removed afterwards.
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

const TEST_PASSWORD = "Test-Password-123!";
// The same real 1x1 PNG the gallery tests upload.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

let supabaseUserId: string | null = null;
let eventId: string | null = null;
const uploadedUrls: string[] = [];

function objectPathOf(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

async function cleanup() {
  const paths = uploadedUrls.map(objectPathOf).filter((value): value is string => !!value);
  if (paths.length) await admin.storage.from(BUCKET).remove(paths);
  uploadedUrls.length = 0;

  if (eventId) await prisma.event.deleteMany({ where: { id: eventId } });
  if (supabaseUserId) {
    await prisma.user.deleteMany({ where: { id: supabaseUserId } });
    await admin.auth.admin.deleteUser(supabaseUserId);
  }
  eventId = null;
  supabaseUserId = null;
}

async function createOwnerAndEvent(page: Page, type: EventType, title: string) {
  const email = `e2e-idphoto-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  supabaseUserId = data.user.id;
  await prisma.user.create({ data: { id: data.user.id, email, name: "E2E Identity Photo" } });
  const event = await prisma.event.create({
    data: {
      ownerId: data.user.id,
      type,
      title,
      slug: `e2e-idphoto-${randomUUID()}`,
      status: "PUBLISHED",
    },
  });
  eventId = event.id;

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  return event;
}

function pngFile(name: string) {
  return { name, mimeType: "image/png", buffer: TINY_PNG };
}

test.describe("identity photos", () => {
  test.afterEach(cleanup);
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("a wedding owner uploads the bride's and groom's photos; both persist and show on the invitation, and removing one clears it", async ({
    page,
  }) => {
    const event = await createOwnerAndEvent(page, "WEDDING", "Pernikahan Foto E2E");

    await page.goto(`/dashboard/events/${event.id}/editor`);
    await page.getByRole("button", { name: "Mempelai", exact: true }).click();

    await page.locator("#brideFullName").fill("Ayu Lestari");
    await page.locator("#groomFullName").fill("Budi Santoso");
    await page.setInputFiles("#bridePhotoUrl-file", pngFile("ayu.png"));
    await expect(page.getByRole("img", { name: "Foto: Foto" }).first()).toBeVisible();
    await page.setInputFiles("#groomPhotoUrl-file", pngFile("budi.png"));

    await expect
      .poll(async () => {
        const row = await prisma.weddingProfile.findUnique({ where: { eventId: event.id } });
        if (row?.bridePhotoUrl) uploadedUrls.push(row.bridePhotoUrl);
        if (row?.groomPhotoUrl) uploadedUrls.push(row.groomPhotoUrl);
        return [!!row?.bridePhotoUrl, !!row?.groomPhotoUrl, row?.brideFullName];
      })
      .toEqual([true, true, "Ayu Lestari"]);

    const row = await prisma.weddingProfile.findUniqueOrThrow({ where: { eventId: event.id } });
    expect(row.bridePhotoUrl).toContain(`/events/${event.id}/identity/`);
    expect(row.groomPhotoUrl).toContain(`/events/${event.id}/identity/`);
    expect(row.bridePhotoUrl).not.toBe(row.groomPhotoUrl);

    // On the public invitation each photo sits with its own person.
    await page.goto(`/invite/${event.slug}`);
    await revealInvitation(page);
    await expect(page.getByRole("img", { name: "Foto Ayu Lestari" })).toHaveAttribute(
      "src",
      row.bridePhotoUrl!,
    );
    await expect(page.getByRole("img", { name: "Foto Budi Santoso" })).toHaveAttribute(
      "src",
      row.groomPhotoUrl!,
    );

    // Removing the bride's photo clears it and keeps the groom's.
    await page.goto(`/dashboard/events/${event.id}/editor`);
    await page.getByRole("button", { name: "Mempelai", exact: true }).click();
    await page.getByRole("button", { name: "Hapus Foto" }).first().click();
    await expect
      .poll(async () => {
        const current = await prisma.weddingProfile.findUnique({ where: { eventId: event.id } });
        return [current?.bridePhotoUrl, !!current?.groomPhotoUrl];
      })
      .toEqual([null, true]);
  });

  test("a birthday owner uploads the celebrant's photo and it shows on the invitation", async ({
    page,
  }) => {
    const event = await createOwnerAndEvent(page, "BIRTHDAY", "Ulang Tahun Foto E2E");

    await page.goto(`/dashboard/events/${event.id}/editor`);
    await page.getByRole("button", { name: "Yang Berulang Tahun", exact: true }).click();

    await page.locator("#fullName").fill("Citra Anindya");
    await page.setInputFiles("#photoUrl-file", pngFile("citra.png"));

    await expect
      .poll(async () => {
        const row = await prisma.personProfile.findUnique({ where: { eventId: event.id } });
        if (row?.photoUrl) uploadedUrls.push(row.photoUrl);
        return !!row?.photoUrl;
      })
      .toBe(true);

    const row = await prisma.personProfile.findUniqueOrThrow({ where: { eventId: event.id } });
    await page.goto(`/invite/${event.slug}`);
    await revealInvitation(page);
    await expect(page.getByRole("img", { name: "Foto Citra Anindya" })).toHaveAttribute(
      "src",
      row.photoUrl!,
    );
  });

  test("a file that is not an image is refused with a clear reason and nothing is stored", async ({
    page,
  }) => {
    const event = await createOwnerAndEvent(page, "BIRTHDAY", "Ulang Tahun Foto Ditolak");

    await page.goto(`/dashboard/events/${event.id}/editor`);
    await page.getByRole("button", { name: "Yang Berulang Tahun", exact: true }).click();
    await page.setInputFiles("#photoUrl-file", {
      name: "catatan.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("bukan gambar"),
    });

    await expect(page.getByText("Format tidak didukung")).toBeVisible();
    expect(await prisma.personProfile.count({ where: { eventId: event.id } })).toBe(0);
  });
});
