import { expect, test } from "@playwright/test";

/**
 * Homepage MVP (docs/PRD.md §7-8, D-073) — public, unauthenticated
 * marketing entry point. Console-error and mobile-overflow checks follow
 * the same pattern already established by e2e/templates.spec.ts.
 */
test.describe("homepage", () => {
  test("is accessible without authentication and renders the core sections", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Undangan Digital yang Cantik, Personal, dan Berkesan.",
      }),
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: "Pilih Template Favoritmu" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Semua yang Kamu Butuhkan untuk Undangan Digital" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cara Kerjanya" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lihat Tampilan Undanganmu" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Harga yang Jelas, Tanpa Kejutan" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Pertanyaan yang Sering Diajukan" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Siap Membuat Undangan Digitalmu?" }),
    ).toBeVisible();

    // No dashboard/admin navigation leaks onto the public homepage.
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveCount(0);
  });

  test("anonymous visitor's primary CTA leads to registration", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Buat Undangan" }).first().click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("login link leads to the login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Masuk" }).first().click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("the template CTA scrolls to the Template Showcase section", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Lihat Template" }).click();
    await expect(page).toHaveURL(/\/#template-showcase$/);
    await expect(page.getByRole("heading", { name: "Pilih Template Favoritmu" })).toBeInViewport();
  });

  test("pricing section renders the real seeded plans", async ({ page }) => {
    await page.goto("/");

    const pricing = page.locator("section", {
      has: page.getByRole("heading", { name: "Harga yang Jelas, Tanpa Kejutan" }),
    });
    await expect(pricing.getByText("Free", { exact: true })).toBeVisible();
    await expect(pricing.getByText("Premium", { exact: true })).toBeVisible();
    await expect(pricing.getByText("Business", { exact: true })).toBeVisible();
    // The Free plan's price is read from the database (price 0), not
    // hardcoded — rendered as "Gratis" rather than a literal "Rp 0".
    await expect(pricing.getByText("Gratis", { exact: true })).toBeVisible();
  });

  test("renders real event data (no console errors, no mobile overflow at 390px)", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: /Undangan Digital/ })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth, "homepage: horizontal overflow at 390px").toBeLessThanOrEqual(
      clientWidth + 1,
    );

    expect(consoleErrors, "homepage: console errors").toEqual([]);
  });
});
