import { expect, test, type Page } from "@playwright/test";

/**
 * Public invitation layout guards that need no login: the page never scrolls
 * sideways, and the countdown shows its four units. Uses the template demo
 * (full sample content, every section on).
 */
async function openDemo(page: Page, slug: string) {
  await page.goto(`/demo/${slug}`);
  const open = page.getByRole("button", { name: "Buka Undangan" });
  if (await open.count()) await open.click();
}

async function hasHorizontalScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

test.describe("public invitation layout", () => {
  for (const [label, size] of [
    ["phone", { width: 390, height: 844 }],
    ["laptop", { width: 1535, height: 760 }],
  ] as const) {
    test(`does not scroll sideways on a ${label}`, async ({ page }) => {
      await page.setViewportSize(size);
      await openDemo(page, "vintage-sepia");
      await page.waitForTimeout(500);

      expect(await hasHorizontalScroll(page)).toBe(false);
    });
  }

  test("the countdown shows days, hours, minutes and seconds as discs", async ({ page }) => {
    await openDemo(page, "vintage-sepia");
    const countdown = page.getByRole("region", { name: "Hitung mundur" });
    await countdown.scrollIntoViewIfNeeded();

    await expect(countdown.getByTestId("countdown-value")).toHaveCount(4);
    for (const label of ["Hari", "Jam", "Menit", "Detik"]) {
      await expect(countdown.getByText(label, { exact: true })).toBeVisible();
    }
  });
});

test("the health endpoint reports ok and is never cached", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
  expect(response.headers()["cache-control"]).toContain("no-store");
});
