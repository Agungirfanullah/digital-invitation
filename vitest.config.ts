import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e/**", "playwright-report/**"],
    // vitest's 5000ms default was hit by lib/checkin/service.integration.test.ts
    // in CI (never locally) — GitHub's runner has far fewer cores than a dev
    // machine, so the ~10 integration test files that hit the real Supabase
    // DEV database concurrently contend harder for connections/network there
    // than they do locally. This is the same class of flakiness already
    // documented for Phase 3/15 work, raised globally (not per-file) since
    // any of the 10 integration test files can hit it, not just whichever
    // one happened to tip over first. See docs/DECISIONS.md D-056.
    //
    // 15000 wasn't enough headroom: the next CI run still failed, this time
    // spreading across lib/editor/, lib/rsvp/, and lib/checkin/ — notably
    // including lib/editor/service.integration.test.ts's real Supabase
    // Storage upload tests (two sequential real uploads per test), which are
    // more network-latency-sensitive than a plain Postgres query. Raised
    // further to 30000 — see docs/DECISIONS.md D-057.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "server-only": path.resolve(dirname, "./test/mocks/server-only.ts"),
      "@": dirname,
    },
  },
});
