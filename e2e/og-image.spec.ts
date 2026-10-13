import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * Link-preview (Open Graph) images for public invitations. Real DB rows and
 * real image rendering; no login is needed because the routes are public.
 */
loadEnv({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const createdSupabaseUserIds: string[] = [];
const createdEventIds: string[] = [];

async function createOwner() {
  const email = `e2e-og-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "Test-Password-123!",
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);
  await prisma.user.create({ data: { id: data.user.id, email, name: "E2E OG" } });
  return data.user.id;
}

async function createEvent(ownerId: string, status: "DRAFT" | "PUBLISHED") {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: `Pernikahan OG ${status}`,
      slug: `e2e-og-${randomUUID()}`,
      status,
    },
  });
  createdEventIds.push(event.id);
  return event;
}

test.describe("link-preview images", () => {
  test.afterEach(async () => {
    if (createdEventIds.length) {
      await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
      createdEventIds.length = 0;
    }
    if (createdSupabaseUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdSupabaseUserIds } } });
      for (const id of createdSupabaseUserIds) await admin.auth.admin.deleteUser(id);
      createdSupabaseUserIds.length = 0;
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("a published invitation advertises an absolute, working og:image", async ({
    page,
    request,
  }) => {
    const event = await createEvent(await createOwner(), "PUBLISHED");

    await page.goto(`/invite/${event.slug}`);
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(ogImage).toMatch(new RegExp(`^https?://[^/]+/invite/${event.slug}/opengraph-image`));
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );

    const response = await request.get(`/invite/${event.slug}/opengraph-image`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect(response.headers()["cache-control"]).toContain("s-maxage");
    expect((await response.body()).length).toBeGreaterThan(5_000);
  });

  test("draft and nonexistent slugs get the identical generic image, different from a published one", async ({
    request,
  }) => {
    const owner = await createOwner();
    const published = await createEvent(owner, "PUBLISHED");
    const draft = await createEvent(owner, "DRAFT");

    const get = async (slug: string) =>
      (await request.get(`/invite/${slug}/opengraph-image`)).body();

    const [publishedImage, draftImage, missingImage] = await Promise.all([
      get(published.slug),
      get(draft.slug),
      get(`e2e-og-missing-${randomUUID()}`),
    ]);

    expect(draftImage.equals(missingImage)).toBe(true);
    expect(draftImage.equals(publishedImage)).toBe(false);
  });

  test("a personalized ?to= link never changes the preview image", async ({ request }) => {
    const event = await createEvent(await createOwner(), "PUBLISHED");

    const plain = await (await request.get(`/invite/${event.slug}/opengraph-image`)).body();
    const personalized = await (
      await request.get(`/invite/${event.slug}/opengraph-image?to=some-guest-token`)
    ).body();

    expect(personalized.equals(plain)).toBe(true);
  });

  test("template demos and the site root also have preview images", async ({ request }) => {
    for (const url of ["/demo/dark-luxury/opengraph-image", "/opengraph-image"]) {
      const response = await request.get(url);
      expect(response.status(), url).toBe(200);
      expect(response.headers()["content-type"], url).toBe("image/png");
    }
  });
});
