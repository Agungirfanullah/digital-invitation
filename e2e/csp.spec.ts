import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

/**
 * The stricter style policy (D-108) must not block anything the app renders:
 * public pages, an invitation, and the editor with a date-picker popover
 * open. A blocked <style> or stylesheet shows up as a console error naming
 * the Content Security Policy.
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const TEST_PASSWORD = "Test-Password-123!";
let userId: string | null = null;
let eventId: string | null = null;

function collectCspViolations(page: Page): string[] {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) {
      violations.push(message.text());
    }
  });
  return violations;
}

test.describe("content security policy", () => {
  test.afterEach(async () => {
    if (eventId) await prisma.event.deleteMany({ where: { id: eventId } });
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
      await admin.auth.admin.deleteUser(userId);
    }
    eventId = null;
    userId = null;
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("public pages render without a policy violation", async ({ page }) => {
    const violations = collectCspViolations(page);
    for (const url of ["/", "/demo/royal-gold", "/login", "/register", "/kebijakan-privasi"]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
    }
    expect(violations).toEqual([]);
  });

  test("the editor, with a date-picker popover open, renders without a policy violation", async ({
    page,
  }) => {
    const email = `e2e-csp-${randomUUID()}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
    userId = data.user.id;
    await prisma.user.create({ data: { id: userId, email, name: "E2E CSP" } });
    const event = await prisma.event.create({
      data: {
        ownerId: userId,
        type: "WEDDING",
        title: "Pernikahan CSP",
        slug: `e2e-csp-${randomUUID()}`,
        status: "PUBLISHED",
      },
    });
    eventId = event.id;

    const violations = collectCspViolations(page);
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/dashboard/events/${event.id}/editor`);
    await page.getByRole("button", { name: "Jadwal Acara" }).click();
    await page.getByRole("button", { name: "Tambah Jadwal" }).click();
    await page.getByRole("button", { name: /^Tanggal/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.goto(`/invite/${event.slug}`);
    await page.waitForLoadState("networkidle");
    expect(violations).toEqual([]);
  });
});
