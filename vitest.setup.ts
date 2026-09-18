import path from "node:path";

import { config as loadEnv } from "dotenv";

// Vitest doesn't auto-load .env.local the way Next.js does (see
// prisma.config.ts for the same problem on the Prisma CLI side). Loaded
// here, before any test imports `lib/db/prisma`, so integration tests that
// exercise the real Supabase DEV database (e.g. lib/events authorization)
// can run via `npm run test` without a separate env-loading step. Doesn't
// override variables already set in the environment (e.g. in CI).
loadEnv({ path: path.join(process.cwd(), ".env.local") });

import "@testing-library/jest-dom/vitest";
