import { PrismaClient } from "@prisma/client";

/**
 * How long an interactive `$transaction` may wait for a pooled connection.
 * `DATABASE_URL` uses Supabase's pooler with a small `connection_limit`
 * (1 locally and in CI), so concurrent requests in one server process queue
 * for it. Prisma's 2s default made the later transactions in that queue fail
 * with "Unable to start a transaction in the given time" (seen in
 * onboarding); 10s matches Prisma's `pool_timeout` default for ordinary
 * queries, so a transaction waits as long as any other query. See
 * docs/DECISIONS.md D-111.
 */
export const TRANSACTION_MAX_WAIT_MS = 10_000;

// Serverless-safe singleton: reuse a single PrismaClient across hot reloads
// in development and across warm serverless invocations, instead of opening
// a new database connection on every import. See docs/DATABASE.md §0.4.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    transactionOptions: { maxWait: TRANSACTION_MAX_WAIT_MS },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
