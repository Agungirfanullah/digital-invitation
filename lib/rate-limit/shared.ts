import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  consumeRateLimit as consumeMemoryRateLimit,
  type RateLimitOptions,
  type RateLimitResult,
} from "@/lib/rate-limit";

/**
 * The rate limiter every caller uses. Counters live in the database
 * (`RateLimitBucket`), so they are shared by every serverless instance:
 * the in-memory limiter alone gives each Vercel instance its own counter,
 * so an attacker spread across instances is barely limited (D-089).
 *
 * The database is used because the project already runs on it; a Redis
 * service would be one more thing to operate. The cost is one small query
 * per limited request.
 *
 * Tests (`NODE_ENV=test`) and the E2E server (`E2E_TEST_MODE=true`, the same
 * fail-closed switch the login-limit override uses) stay on the in-memory
 * store: their many requests come from one address and must not leave
 * counters in a shared database that the next run would inherit.
 *
 * If the database cannot be reached, the request falls back to the
 * in-memory limiter instead of failing: a limiter outage must not lock
 * everyone out of logging in or sending an RSVP.
 */
export function usesSharedStore(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== "test" && env.E2E_TEST_MODE !== "true";
}

/** Roughly one call in this many also deletes long-expired rows. */
const CLEANUP_ONE_IN = 50;

interface BucketRow {
  count: number;
  resetAt: Date;
}

export async function consumeDatabaseRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): Promise<RateLimitResult> {
  // One atomic statement: concurrent requests cannot both read the same
  // count and each write count + 1. The database clock is the single clock,
  // so instances with different system times agree on when a window ends.
  const rows = await prisma.$queryRaw<BucketRow[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + (${windowMs}::int * interval '1 millisecond'))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= now() THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= now() THEN now() + (${windowMs}::int * interval '1 millisecond')
        ELSE "RateLimitBucket"."resetAt"
      END
    RETURNING "count", "resetAt"
  `;

  const row = rows[0];
  if (!row) throw new Error("Rate limit upsert returned no row.");

  if (Math.floor(Math.random() * CLEANUP_ONE_IN) === 0) {
    // Housekeeping only: a failure here must not affect the request.
    await prisma.$executeRaw`
      DELETE FROM "RateLimitBucket" WHERE "resetAt" < now() - interval '1 hour'
    `.catch(() => undefined);
  }

  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: row.resetAt.getTime(),
  };
}

export async function consumeSharedRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  if (!usesSharedStore()) return consumeMemoryRateLimit(key, options);

  try {
    return await consumeDatabaseRateLimit(key, options);
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "rate_limit_store_unavailable",
        // Only the bucket's action prefix — keys can contain an IP or user id.
        bucket: key.split(":").slice(0, 2).join(":"),
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    return consumeMemoryRateLimit(key, options);
  }
}
