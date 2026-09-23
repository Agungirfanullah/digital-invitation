import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
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
