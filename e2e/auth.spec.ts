import { expect, test } from "@playwright/test";

test.describe("authentication foundation", () => {
  test("unauthenticated users are redirected away from the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    await expect(page.getByRole("heading", { name: "Masuk" })).toBeVisible();
  });

  test("register page renders the sign-up form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Buat akun" })).toBeVisible();
    await expect(page.getByLabel("Nama")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("login rejects invalid credentials with a friendly, non-technical message", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nonexistent-user@example.com");
    await page.getByLabel("Kata sandi", { exact: true }).fill("wrongpassword123");
    await page.getByRole("button", { name: "Masuk" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText("Error");
    await expect(alert).not.toContainText("Prisma");
  });

  test("homepage links to register and login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Buat Akun" }).click();
    await expect(page).toHaveURL(/\/register$/);
  });
});
