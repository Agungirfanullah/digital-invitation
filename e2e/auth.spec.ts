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

  test("a failed sign-up keeps the name and email but clears both passwords", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Nama").fill("Budi Santoso");
    await page.getByLabel("Email").fill("budi.santoso@example.com");
    await page.getByLabel("Kata sandi", { exact: true }).fill("Password123");
    await page.getByLabel("Konfirmasi kata sandi").fill("Berbeda12345");
    await page.getByRole("button", { name: "Buat akun" }).click();

    await expect(page.getByText("Periksa kembali data yang kamu masukkan.")).toBeVisible();
    await expect(page.getByLabel("Nama")).toHaveValue("Budi Santoso");
    await expect(page.getByLabel("Email")).toHaveValue("budi.santoso@example.com");
    await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Konfirmasi kata sandi")).toHaveValue("");
  });

  test("a failed login keeps the email but clears the password", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nonexistent-user@example.com");
    await page.getByLabel("Kata sandi", { exact: true }).fill("wrongpassword123");
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page.getByText("Email atau kata sandi salah.")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue("nonexistent-user@example.com");
    await expect(page.getByLabel("Kata sandi", { exact: true })).toHaveValue("");
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
    await page.getByRole("link", { name: "Buat Undangan" }).first().click();
    await expect(page).toHaveURL(/\/register$/);
  });
});
