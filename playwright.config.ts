import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  // Both defaults (test: 30_000ms, expect: 5_000ms) were never raised and
  // were too tight for CI specifically — never observed locally. A CI-only
  // run's Playwright report showed real page.goto/page.reload calls alone
  // exceeding the 30s test timeout (editor, rsvp-dashboard, wishes), and
  // expect().toBeVisible()/toHaveURL() hitting the 5s default after a real
  // mutation (search, upload, form submit + redirect) — the same "CI's
  // network path to Supabase is slower than local" root cause already
  // documented for the Vitest integration-test timeouts (D-056/D-057),
  // now showing up in E2E too. See docs/DECISIONS.md D-058.
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    // Test-server-only login rate-limit ceiling: the suite performs ~42 real
    // logins per run from one address, past the production limit of 30 per
    // 10 minutes. Honored only when NODE_ENV=development, i.e. `next dev`
    // (see lib/auth/rate-limit.ts and docs/DECISIONS.md D-055).
    env: { E2E_AUTH_LOGIN_RATE_LIMIT: "500" },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
