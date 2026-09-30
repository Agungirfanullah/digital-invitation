import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";

/**
 * D-071 Onboarding MVP. Authenticated-flow fixtures follow the same
 * Supabase-admin-provisioned-user pattern as e2e/templates.spec.ts and
 * e2e/wishes.spec.ts (the DEV project's Auth config rejects synthetic
 * email domains, so a real `admin.auth.admin.createUser()` call is
 * required rather than a Prisma-only fixture).
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
  const email = `e2e-onboarding-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Onboarding Test ${label}` },
  });

  return { email, userId: user.id };
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Masuk" }).click();
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

test.describe("onboarding", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("unauthenticated access to /onboarding is redirected to login", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });

  test("a new user with no existing event completes onboarding and lands in the editor with a real DRAFT event", async ({
    page,
  }) => {
    // `registerAction`'s own immediate-session redirect sends a genuinely
    // new user straight to `/onboarding` (not exercised here — the DEV
    // Supabase project rejects the synthetic email domains E2E fixtures
    // must use for a real `/register` submission, the same documented
    // limitation e2e/invitation.spec.ts's fixtures already work around).
    // This test instead proves the destination page/flow itself is
    // correct: an authenticated, eventless user who navigates to
    // `/onboarding` completes it and ends up with a real DRAFT event.
    const owner = await createAuthenticatedTestUser("happy-path");

    await login(page, owner.email);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/onboarding");
    await expect(
      page.getByRole("heading", { name: "Yuk, buat undangan pertamamu." }),
    ).toBeVisible();

    // Step 1: type — keep the default (Pernikahan/WEDDING).
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 2: name.
    await page.getByLabel("Nama acara").fill("Pernikahan E2E Onboarding");
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 3: date.
    await page.getByLabel("Tanggal acara").fill("2026-12-12");
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 4: identity (COUPLE — two names).
    await page.getByLabel("Mempelai Wanita").fill("Ayu");
    await page.getByLabel("Mempelai Pria").fill("Budi");
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Step 5: template — the first option is selected by default.
    await expect(page.getByText("Dipilih")).toBeVisible();
    await page.getByRole("button", { name: "Buat Undangan" }).click();

    await expect(page).toHaveURL(/\/dashboard\/events\/[^/]+\/editor$/);

    const event = await prisma.event.findFirstOrThrow({
      where: { ownerId: owner.userId },
      include: { schedules: true, weddingProfile: true, template: true },
    });
    createdEventIds.push(event.id);

    expect(event.status).toBe("DRAFT");
    expect(event.publishedAt).toBeNull();
    expect(event.title).toBe("Pernikahan E2E Onboarding");
    expect(event.type).toBe("WEDDING");
    expect(event.template).not.toBeNull();
    expect(event.schedules).toHaveLength(1);
    expect(event.weddingProfile?.brideNickname).toBe("Ayu");
    expect(event.weddingProfile?.groomNickname).toBe("Budi");

    // Exactly one event was created by the one submission (no duplicate).
    const allEvents = await prisma.event.findMany({ where: { ownerId: owner.userId } });
    expect(allEvents).toHaveLength(1);
  });

  test("GENERIC (OTHER) event type skips the identity step entirely", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("generic-type");

    await login(page, owner.email);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/onboarding");

    await page.getByLabel("Jenis acara").selectOption("OTHER");
    await page.getByRole("button", { name: "Lanjut" }).click();

    await page.getByLabel("Nama acara").fill("Acara Lainnya E2E");
    await page.getByRole("button", { name: "Lanjut" }).click();

    await page.getByLabel("Tanggal acara").fill("2026-06-01");
    await page.getByRole("button", { name: "Lanjut" }).click();

    // Identity step is skipped — the next click already shows the template step.
    await expect(page.getByText("Template undangan")).toBeVisible();
    await page.getByRole("button", { name: "Buat Undangan" }).click();

    await expect(page).toHaveURL(/\/dashboard\/events\/[^/]+\/editor$/);

    const event = await prisma.event.findFirstOrThrow({ where: { ownerId: owner.userId } });
    createdEventIds.push(event.id);
    expect(event.type).toBe("OTHER");
    expect(event.status).toBe("DRAFT");
  });

  test("BIRTHDAY (PERSON family) shows a single name field, not couple fields", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("person-type");

    await login(page, owner.email);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/onboarding");

    await page.getByLabel("Jenis acara").selectOption("BIRTHDAY");
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByLabel("Nama acara").fill("Ulang Tahun E2E");
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByLabel("Tanggal acara").fill("2026-07-01");
    await page.getByRole("button", { name: "Lanjut" }).click();

    await expect(page.getByLabel("Mempelai Wanita")).toHaveCount(0);
    await page.getByLabel("Yang Berulang Tahun").fill("Citra");
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByRole("button", { name: "Buat Undangan" }).click();

    await expect(page).toHaveURL(/\/dashboard\/events\/[^/]+\/editor$/);

    const event = await prisma.event.findFirstOrThrow({
      where: { ownerId: owner.userId },
      include: { personProfile: true },
    });
    createdEventIds.push(event.id);
    expect(event.type).toBe("BIRTHDAY");
    expect(event.personProfile?.nickname).toBe("Citra");
  });

  test("cannot advance past a step with required input missing", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("validation");

    await login(page, owner.email);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/onboarding");

    await page.getByRole("button", { name: "Lanjut" }).click(); // past type step
    await page.getByRole("button", { name: "Lanjut" }).click(); // name left empty

    // Scoped past Next's own route-announcer (also `role="alert"`).
    await expect(page.getByText("Nama acara minimal 3 karakter.")).toBeVisible();
    // Still on the name step — the date field is in the DOM (all steps are,
    // via the `hidden` attribute) but not shown yet.
    await expect(page.getByLabel("Tanggal acara")).toBeHidden();
  });

  test("an existing user with an event is not forced through onboarding on login, and manually opening /onboarding redirects to the dashboard without creating another event", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("existing-user");
    const existing = await prisma.event.create({
      data: {
        ownerId: owner.userId,
        type: "WEDDING",
        title: "Acara Sudah Ada",
        slug: `e2e-onboarding-existing-${randomUUID()}`,
        status: "DRAFT",
      },
    });
    createdEventIds.push(existing.id);

    await login(page, owner.email);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/dashboard$/);

    const events = await prisma.event.findMany({ where: { ownerId: owner.userId } });
    expect(events).toHaveLength(1);
  });
});
