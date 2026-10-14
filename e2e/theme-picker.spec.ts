import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

/**
 * "Warna & Font" lets an owner pick a named color and a listed font instead of
 * typing hex codes and CSS stacks. Real login (admin-provisioned, D-022); the
 * assertions read the saved Theme row, so autosave is verified end to end.
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const TEST_PASSWORD = "Test-Password-123!";
const GEORGIA = "Georgia, 'Times New Roman', serif";

let supabaseUserId: string | null = null;
let eventId: string | null = null;

async function cleanup() {
  if (eventId) await prisma.event.deleteMany({ where: { id: eventId } });
  if (supabaseUserId) {
    await prisma.user.deleteMany({ where: { id: supabaseUserId } });
    await admin.auth.admin.deleteUser(supabaseUserId);
  }
  eventId = null;
  supabaseUserId = null;
}

async function openThemeSection(page: Page, id: string) {
  await page.goto(`/dashboard/events/${id}/editor`);
  await page.getByRole("button", { name: "Warna & Font" }).click();
  await expect(page.getByRole("heading", { name: "Warna & Font", exact: true })).toBeVisible();
}

async function savedColorAndFont(id: string) {
  const theme = await prisma.theme.findUnique({ where: { eventId: id } });
  return theme ? [theme.primaryColor, theme.headingFont] : null;
}

test.describe("theme colors and fonts", () => {
  test.afterEach(cleanup);
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("an owner picks a named color and a listed font; both persist and can go back to the template default", async ({
    page,
  }) => {
    const email = `e2e-theme-${randomUUID()}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
    supabaseUserId = data.user.id;
    await prisma.user.create({ data: { id: data.user.id, email, name: "E2E Theme Test" } });
    const event = await prisma.event.create({
      data: {
        ownerId: data.user.id,
        type: "WEDDING",
        title: "Pernikahan Tema E2E",
        slug: `e2e-theme-${randomUUID()}`,
        status: "DRAFT",
      },
    });
    eventId = event.id;

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await openThemeSection(page, event.id);

    // No hex typing: each color offers named swatches and the browser's picker.
    await expect(page.getByTestId("primaryColor-current")).toHaveText("Bawaan tema");

    const primary = page.getByRole("group", { name: "Pilihan Warna utama" });
    await primary.getByRole("button", { name: "Emas" }).click();
    await expect(page.getByTestId("primaryColor-current")).toHaveText("Emas");

    await page.getByLabel("Font judul").selectOption({ label: "Georgia" });

    await expect.poll(() => savedColorAndFont(event.id)).toEqual(["#c9a227", GEORGIA]);

    // Still chosen after a reload.
    await openThemeSection(page, event.id);
    await expect(page.getByTestId("primaryColor-current")).toHaveText("Emas");
    await expect(page.getByLabel("Font judul")).toHaveValue(GEORGIA);

    // Back to the template's own look.
    await page.getByRole("button", { name: "Pakai bawaan tema" }).click();
    await page.getByLabel("Font judul").selectOption({ label: "Bawaan tema" });
    await expect(page.getByTestId("primaryColor-current")).toHaveText("Bawaan tema");

    await expect.poll(() => savedColorAndFont(event.id)).toEqual([null, null]);
  });
});
