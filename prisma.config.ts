import path from "node:path";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// The Prisma CLI does not auto-load .env.local the way Next.js does, so we
// load it explicitly here. Application code should read env vars through
// lib/env.ts instead of process.env directly.
loadEnv({ path: path.join(process.cwd(), ".env.local") });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
