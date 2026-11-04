import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * Background music (D-109): an owner uploads an MP3 in the editor, it is
 * stored and saved, and the published invitation carries it. Skipped,
 * with the reason, while the storage bucket does not accept audio yet:
 * `npm run storage:configure` sets that up per environment.
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "invitation-assets";
const TEST_PASSWORD = "Test-Password-123!";

// A tiny file that passes the MP3 signature check (ID3 header + padding).
const FAKE_MP3 = Buffer.concat([Buffer.from("ID3"), Buffer.alloc(2048, 0)]);

let userId: string | null = null;
let eventId: string | null = null;

test.describe("background music", () => {
  test.afterEach(async () => {
    if (eventId) {
      const { data } = await admin.storage.from(BUCKET).list(`events/${eventId}/music`);
      if (data?.length) {
        await admin.storage
          .from(BUCKET)
          .remove(data.map((file) => `events/${eventId}/music/${file.name}`));
      }
      await prisma.event.deleteMany({ where: { id: eventId } });
    }
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

  test("an owner uploads a song and the published invitation plays it", async ({ page }) => {
    const { data: bucket } = await admin.storage.getBucket(BUCKET);
    test.skip(
      !bucket?.allowed_mime_types?.includes("audio/mpeg"),
      "Storage bucket does not accept audio yet; run `npm run storage:configure`.",
    );

    const email = `e2e-music-${randomUUID()}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
    userId = data.user.id;
    await prisma.user.create({ data: { id: userId, email, name: "E2E Musik" } });
    const event = await prisma.event.create({
      data: {
        ownerId: userId,
        type: "WEDDING",
        title: "Pernikahan Musik",
        slug: `e2e-music-${randomUUID()}`,
        status: "PUBLISHED",
      },
    });
    eventId = event.id;

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/dashboard/events/${event.id}/editor`);
    await page.getByRole("button", { name: "Musik", exact: true }).click();
    await page.setInputFiles("#music-file", {
      name: "Lagu Pernikahan.mp3",
      mimeType: "audio/mpeg",
      buffer: FAKE_MP3,
    });
    await expect(page.getByText("Lagu Pernikahan")).toBeVisible({ timeout: 30_000 });

    const stored = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    const music = (stored.settings as { music?: { url: string; source: string } } | null)?.music;
    expect(music?.source).toBe("upload");
    expect(music?.url).toContain(`/events/${event.id}/music/`);

    await page.goto(`/invite/${event.slug}`);
    await expect(page.locator("audio")).toHaveAttribute("src", music!.url);
  });
});
