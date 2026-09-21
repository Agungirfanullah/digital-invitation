import path from "node:path";
import { randomUUID } from "node:crypto";

import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

/**
 * The guest-facing wish submission flow is public/unauthenticated (Prisma
 * fixtures, no login needed — same pattern as e2e/rsvp.spec.ts), while
 * moderation requires a real login (admin-provisioned, docs/DECISIONS.md
 * D-022 — same pattern as e2e/gifts-dashboard.spec.ts and
 * e2e/rsvp-dashboard.spec.ts).
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
  const email = `e2e-wishes-${label}-${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`Failed to create test auth user: ${error?.message}`);
  createdSupabaseUserIds.push(data.user.id);

  const user = await prisma.user.create({
    data: { id: data.user.id, email, name: `E2E Wishes Test ${label}` },
  });

  return { email, userId: user.id };
}

async function createTestEvent(ownerId: string, status: "DRAFT" | "PUBLISHED" = "PUBLISHED") {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Ucapan E2E",
      slug: `e2e-wishes-${randomUUID()}`,
      status,
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function createTestGuest(eventId: string, name = "Dewi Kartika") {
  const guest = await prisma.guest.create({
    data: { eventId, name, normalizedName: name.toLowerCase() },
  });
  const invitation = await prisma.guestInvitation.create({
    data: { eventId, guestId: guest.id, token: `e2e-wishes-token-${randomUUID()}` },
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

test.describe("wishes", () => {
  test.afterEach(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("a non-personalized invitation cannot submit a wish", async ({ page }) => {
    const owner = await prisma.user.create({
      data: {
        id: `test-e2e-wishes-${randomUUID()}`,
        email: `test-e2e-wishes-${randomUUID()}@example.invalid`,
        name: "E2E Wishes Test Owner",
      },
    });
    createdUserIds.push(owner.id);
    const event = await createTestEvent(owner.id);

    await page.goto(`/invite/${event.slug}`);
    await expect(
      page.getByText("Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kirim Ucapan & Doa" })).toHaveCount(0);
  });

  test("a token belonging to a different event cannot submit a wish for this event", async ({
    page,
  }) => {
    const owner = await prisma.user.create({
      data: {
        id: `test-e2e-wishes-${randomUUID()}`,
        email: `test-e2e-wishes-${randomUUID()}@example.invalid`,
        name: "E2E Wishes Test Owner",
      },
    });
    createdUserIds.push(owner.id);
    const event = await createTestEvent(owner.id);
    const otherEvent = await createTestEvent(owner.id);
    const { invitation: foreignInvitation } = await createTestGuest(otherEvent.id, "Tamu Asing");

    await page.goto(`/invite/${event.slug}?to=${foreignInvitation.token}`);
    await expect(
      page.getByText("Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kirim Ucapan & Doa" })).toHaveCount(0);
  });

  // One combined test, not several — each step depends on the previous
  // one's mutation (submit → dashboard shows PENDING → approve → appears
  // publicly → hide → disappears publicly), and Playwright's
  // `fullyParallel` config would let independent tests touching the same
  // wish/event race each other. Mirrors e2e/rsvp.spec.ts's justification.
  test("a guest can submit a wish; it appears PENDING in the dashboard; approving it shows it publicly; hiding it removes it again", async ({
    page,
  }) => {
    const owner = await createAuthenticatedTestUser("owner");
    const event = await createTestEvent(owner.userId);
    const { invitation } = await createTestGuest(event.id, "Dewi Kartika");

    // The real guest-facing flow — no login for this half.
    await page.goto(`/invite/${event.slug}?to=${invitation.token}`);
    await expect(page.getByRole("heading", { name: "Kirim Ucapan & Doa" })).toBeVisible();
    await page.getByLabel("Nama").fill("Dewi Kartika");
    // exact: true — otherwise this also matches the section's own
    // aria-labelledby region ("Ucapan & Doa"), whose name contains "Ucapan".
    await page.getByLabel("Ucapan", { exact: true }).fill("Selamat menempuh hidup baru!");
    await page.getByRole("button", { name: "Kirim Ucapan" }).click();
    await expect(page.getByRole("status")).toContainText("Terima kasih!");

    // Not visible publicly yet — still PENDING.
    await page.reload();
    await expect(page.getByText("Selamat menempuh hidup baru!")).toHaveCount(0);

    await login(page, owner.email);
    await page.goto(`/dashboard/events/${event.id}/wishes`);
    // Scoped to the row itself — the status filter dropdown's <option>
    // text otherwise collides with the status badge's identical text.
    const wishRow = page.getByRole("listitem").filter({ hasText: "Dewi Kartika" });
    await expect(wishRow).toBeVisible();
    await expect(wishRow.getByText("Selamat menempuh hidup baru!")).toBeVisible();
    await expect(wishRow.getByText("Menunggu Moderasi", { exact: true })).toBeVisible();

    await wishRow.getByRole("button", { name: "Setujui" }).click();
    await expect(wishRow.getByText("Disetujui", { exact: true })).toBeVisible();

    await page.goto(`/invite/${event.slug}`);
    await expect(page.getByText("Selamat menempuh hidup baru!")).toBeVisible();

    await page.goto(`/dashboard/events/${event.id}/wishes`);
    await wishRow.getByRole("button", { name: "Sembunyikan" }).click();
    await expect(wishRow.getByText("Disembunyikan", { exact: true })).toBeVisible();

    await page.goto(`/invite/${event.slug}`);
    await expect(page.getByText("Selamat menempuh hidup baru!")).toHaveCount(0);
  });

  test("a viewer sees the moderation list but cannot moderate", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner2");
    const viewer = await createAuthenticatedTestUser("viewer");
    const event = await createTestEvent(owner.userId);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.userId, role: "VIEWER" },
    });
    const { guest } = await createTestGuest(event.id, "Budi Santoso");
    await prisma.wish.create({
      data: {
        eventId: event.id,
        guestId: guest.id,
        name: "Budi Santoso",
        message: "Selamat ya!",
        status: "PENDING",
      },
    });

    await login(page, viewer.email);
    await page.goto(`/dashboard/events/${event.id}/wishes`);

    await expect(page.getByText("Budi Santoso", { exact: true })).toBeVisible();
    await expect(page.getByText("Selamat ya!")).toBeVisible();
    await expect(page.getByRole("button", { name: "Setujui" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sembunyikan" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Hapus" })).toHaveCount(0);
  });

  test("a stranger cannot access another owner's wishes dashboard", async ({ page }) => {
    const owner = await createAuthenticatedTestUser("owner3");
    const stranger = await createAuthenticatedTestUser("stranger");
    const event = await createTestEvent(owner.userId);

    await login(page, stranger.email);
    await page.goto(`/dashboard/events/${event.id}/wishes`);
    await expect(page.getByRole("heading", { name: "Acara tidak ditemukan" })).toBeVisible();
  });
});
