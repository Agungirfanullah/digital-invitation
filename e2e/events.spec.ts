import { expect, test } from "@playwright/test";

/**
 * Event-scoped routes reuse the same Proxy-based route protection proven in
 * auth.spec.ts. A full authenticated create/edit/delete browser flow would
 * need a real, deliverable email address — the Supabase DEV project's Auth
 * config rejects synthetic domains (verified directly against the Auth
 * API), so that isn't achievable here without a human-owned inbox. The
 * authoritative proof of authorization/tenancy (own vs. cross-user access)
 * is the live-database integration suite at
 * lib/events/service.integration.test.ts, which exercises the same
 * service layer these routes call, against the real Supabase DEV Postgres
 * database.
 */
test.describe("event routes require authentication", () => {
  test("creating a new event redirects to login when signed out", async ({ page }) => {
    await page.goto("/dashboard/events/new");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fevents%2Fnew$/);
  });

  test("viewing an event redirects to login when signed out", async ({ page }) => {
    await page.goto("/dashboard/events/some-event-id");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("editing an event redirects to login when signed out", async ({ page }) => {
    await page.goto("/dashboard/events/some-event-id/edit");
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});
