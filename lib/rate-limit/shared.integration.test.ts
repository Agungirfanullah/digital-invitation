/**
 * Integration tests for the database-backed rate limiter (D-089), run
 * against the real Supabase DEV Postgres database.
 */
import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { consumeDatabaseRateLimit } from "@/lib/rate-limit/shared";

const PREFIX = `it-rate-limit-${Math.random().toString(36).slice(2)}`;
let counter = 0;
const nextKey = () => `${PREFIX}:${(counter += 1)}`;

afterAll(async () => {
  await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: PREFIX } } });
});

describe("consumeDatabaseRateLimit", () => {
  it("allows up to the limit, then refuses, reporting what is left", async () => {
    const key = nextKey();
    const options = { limit: 3, windowMs: 60_000 };

    const results = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      results.push(await consumeDatabaseRateLimit(key, options));
    }

    expect(results.map((result) => result.allowed)).toEqual([true, true, true, false]);
    expect(results.map((result) => result.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[3].resetAt).toBeGreaterThan(Date.now());
  });

  it("counts each key on its own", async () => {
    const options = { limit: 1, windowMs: 60_000 };
    const busy = nextKey();

    await consumeDatabaseRateLimit(busy, options);

    expect((await consumeDatabaseRateLimit(busy, options)).allowed).toBe(false);
    expect((await consumeDatabaseRateLimit(nextKey(), options)).allowed).toBe(true);
  });

  it("starts a new window once the old one has ended", async () => {
    const key = nextKey();
    const options = { limit: 1, windowMs: 300 };

    expect((await consumeDatabaseRateLimit(key, options)).allowed).toBe(true);
    expect((await consumeDatabaseRateLimit(key, options)).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 600));

    expect((await consumeDatabaseRateLimit(key, options)).allowed).toBe(true);
  });

  it("never lets simultaneous requests exceed the limit", async () => {
    const key = nextKey();
    const options = { limit: 5, windowMs: 60_000 };

    const results = await Promise.all(
      Array.from({ length: 20 }, () => consumeDatabaseRateLimit(key, options)),
    );

    expect(results.filter((result) => result.allowed)).toHaveLength(5);
  });

  it("keeps its counters in the database, so another process would see them", async () => {
    const key = nextKey();
    await consumeDatabaseRateLimit(key, { limit: 5, windowMs: 60_000 });
    await consumeDatabaseRateLimit(key, { limit: 5, windowMs: 60_000 });

    const row = await prisma.rateLimitBucket.findUnique({ where: { key } });
    expect(row?.count).toBe(2);
  });
});
