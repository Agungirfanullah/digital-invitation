import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

import { pickDate, pickTime } from "./helpers/pickers";

/**
 * The schedule form's calendar and time-slot pickers, exercised the way a
 * person uses them, then checked against what actually reached the database.
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

async function createOwnerWithDraftEvent() {
  const email = `e2e-pickers-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);
  await prisma.user.create({ data: { id: data.user.id, email, name: "E2E Pickers" } });

  const event = await prisma.event.create({
    data: {
      ownerId: data.user.id,
      type: "WEDDING",
      title: "Pernikahan Picker E2E",
      slug: `e2e-pickers-${randomUUID()}`,
      status: "DRAFT",
    },
  });
  return { email, eventId: event.id };
}

test.describe("date and time pickers in the schedule form", () => {
  test.afterEach(async () => {
    if (createdSupabaseUserIds.length) {
      await prisma.event.deleteMany({ where: { ownerId: { in: createdSupabaseUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdSupabaseUserIds } } });
      for (const id of createdSupabaseUserIds) await admin.auth.admin.deleteUser(id);
      createdSupabaseUserIds.length = 0;
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("a schedule can be created entirely with the calendar and the time lists", async ({
    page,
  }) => {
    const { email, eventId } = await createOwnerWithDraftEvent();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/dashboard/events/${eventId}/editor`);
    await page.getByRole("button", { name: "Jadwal Acara" }).click();
    await page.getByRole("button", { name: "Tambah Jadwal" }).click();

    await page.getByLabel("Judul acara").fill("Akad Nikah");
    await pickDate(page, "Tanggal", "2027-03-20");
    await pickTime(page, "Mulai", "09:00");

    // The end list cannot offer a time at or before the start (the server
    // rejects it too), but offers the next slot.
    await page.getByRole("button", { name: /^Selesai/ }).click();
    await expect(page.getByRole("option", { name: "08:45", exact: true })).toBeDisabled();
    await expect(page.getByRole("option", { name: "09:00", exact: true })).toBeDisabled();
    await expect(page.getByRole("option", { name: "09:15", exact: true })).toBeEnabled();
    await page.getByRole("option", { name: "10:30", exact: true }).click();

    await expect(page.getByRole("button", { name: /^Tanggal/ })).toContainText("20 Maret 2027");
    await expect(page.getByRole("button", { name: /^Mulai/ })).toContainText("09:00");
    await expect(page.getByRole("button", { name: /^Selesai/ })).toContainText("10:30");

    await page.getByRole("button", { name: "Simpan" }).click();
    // The saved schedule appears in the list (the form closes); checking the
    // date text alone would also match the still-open form's trigger.
    await expect(page.getByRole("button", { name: "Simpan" })).toBeHidden();
    await expect(page.getByText("20 Maret 2027 · 09:00 - 10:30")).toBeVisible();

    const rows = await prisma.eventSchedule.findMany({ where: { eventId } });
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Akad Nikah");
    expect(rows[0].date.toISOString().slice(0, 10)).toBe("2027-03-20");
    expect(rows[0].startTime.toISOString().slice(11, 16)).toBe("09:00");
    expect(rows[0].endTime.toISOString().slice(11, 16)).toBe("10:30");
  });

  test("the calendar opens on the selected month and can page backwards and forwards", async ({
    page,
  }) => {
    const { email, eventId } = await createOwnerWithDraftEvent();

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/dashboard/events/${eventId}/editor`);
    await page.getByRole("button", { name: "Jadwal Acara" }).click();
    await page.getByRole("button", { name: "Tambah Jadwal" }).click();

    await pickDate(page, "Tanggal", "2027-11-05");
    await page.getByRole("button", { name: /^Tanggal/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("November 2027", { exact: true })).toBeVisible();

    await dialog.getByRole("button", { name: "Ke bulan sebelumnya" }).click();
    await expect(dialog.getByText("Oktober 2027", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Ke bulan berikutnya" }).click();
    await dialog.getByRole("button", { name: "Ke bulan berikutnya" }).click();
    await expect(dialog.getByText("Desember 2027", { exact: true })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: /^Tanggal/ })).toContainText("5 November 2027");
  });
});
