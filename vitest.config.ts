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
    // documented for Phase 3/15 work, now raised globally (not per-file)
    // since any of the 10 integration test files can hit it, not just
    // whichever one happened to tip over first. See docs/DECISIONS.md D-056.
    testTimeout: 15000,
    hookTimeout: 15000,
  },
  resolve: {
    alias: {
      "server-only": path.resolve(dirname, "./test/mocks/server-only.ts"),
      "@": dirname,
    },
  },
});
