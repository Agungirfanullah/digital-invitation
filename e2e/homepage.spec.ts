import { expect, test } from "@playwright/test";

test("homepage loads and renders the foundation status message", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Fondasi proyek sedang dibangun." }),
  ).toBeVisible();
});
