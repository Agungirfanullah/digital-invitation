import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 3 — Template System. Covers the two things unit tests can't:
 * (a) the real editor UI can select each new template and it persists,
 * and (b) each new template renders correctly in a real browser (no
 * console errors, no horizontal overflow at the 390×844 mobile baseline).
 * Full RSVP/Wishes/Gift *behavioral* flows are intentionally NOT
 * duplicated per template here — those are already fully covered by
 * e2e/rsvp.spec.ts / e2e/wishes.spec.ts against the shared, un-forked
 * form components every template reuses unchanged (see the Phase 3
 * design audit §13).
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
  const email = `e2e-templates-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Templates Test ${label}` },
  });

  return { email, userId: user.id };
}

async function createPublishedEventWithTemplate(ownerId: string, templateSlug: string) {
  const template = await prisma.template.findUniqueOrThrow({ where: { slug: templateSlug } });
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Template E2E",
      // Kept short — event slugs are capped at 60 chars (lib/events/validation.ts).
      slug: `e2e-tpl-${templateSlug}-${randomUUID().slice(0, 8)}`,
      status: "PUBLISHED",
      templateId: template.id,
    },
  });
  createdEventIds.push(event.id);

  await prisma.weddingProfile.create({
    data: { eventId: event.id, brideNickname: "Ayu", groomNickname: "Budi" },
  });
  await prisma.eventSchedule.create({
    data: {
      event: { connect: { id: event.id } },
      title: "Akad Nikah",
      date: new Date("2026-12-12T00:00:00Z"),
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T10:00:00Z"),
      sortOrder: 0,
      venue: {
        create: {
          name: "Gedung Serbaguna",
          address: "Jl. Uji Coba No. 1, Jakarta",
          event: { connect: { id: event.id } },
        },
      },
    },
  });

  const guest = await prisma.guest.create({
    data: { eventId: event.id, name: "Citra Dewi", normalizedName: "citra dewi" },
  });
  const invitation = await prisma.guestInvitation.create({
    data: { eventId: event.id, guestId: guest.id, token: `e2e-templates-token-${randomUUID()}` },
  });

  return { event, invitation };
}

async function login(page: Page, email: string) {
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

const NEW_TEMPLATES: { slug: string; name: string }[] = [
  { slug: "modern-editorial", name: "Modern Editorial" },
  { slug: "floral-romance", name: "Floral Romance" },
  { slug: "dark-luxury", name: "Dark Luxury" },
  { slug: "traditional-nusantara", name: "Traditional Nusantara" },
  { slug: "soft-romantic", name: "Soft Romantic" },
];

test.describe("template system", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("the editor offers all six templates as selectable, and a new selection persists", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner-editor");
    const event = await prisma.event.create({
      data: {
        ownerId: owner.userId,
        type: "WEDDING",
        title: "Pernikahan Editor Template E2E",
        slug: `e2e-templates-editor-${randomUUID()}`,
        status: "DRAFT",
      },
    });
    createdEventIds.push(event.id);

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/editor`);
    await page.getByRole("button", { name: "Template", exact: true }).click();

    // No template should show the "coming soon" disabled state anymore.
    await expect(page.getByText("Segera hadir")).toHaveCount(0);

    const darkLuxuryOption = page.getByRole("button", { name: /Dark Luxury/ });
    await expect(darkLuxuryOption).toBeEnabled();
    await darkLuxuryOption.click();
    await expect(page.getByText("Dipakai")).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: "Template", exact: true }).click();
    await expect(page.getByRole("button", { name: /Dark Luxury/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  for (const { slug, name } of NEW_TEMPLATES) {
    test(`${name}: renders real event data (including a personalized guest) with no console errors and no mobile overflow`, async ({
      page,
    }) => {
      const owner = await createAuthenticatedTestUser(`owner-${slug}`);
      const { event, invitation } = await createPublishedEventWithTemplate(owner.userId, slug);

      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/invite/${event.slug}?to=${invitation.token}`);

      await expect(page.getByText("Ayu & Budi")).toBeVisible();
      await expect(page.getByText("Citra Dewi").first()).toBeVisible();
      await expect(page.getByText("Akad Nikah")).toBeVisible();
      await expect(page.getByText("Gedung Serbaguna")).toBeVisible();

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth, `${name}: horizontal overflow at 390px`).toBeLessThanOrEqual(
        clientWidth + 1,
      );

      expect(consoleErrors, `${name}: console errors`).toEqual([]);
    });
  }
});
