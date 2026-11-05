/**
 * Regression test for D-111, against the real Supabase DEV database: with a
 * small pool (`connection_limit=1` locally and in CI), concurrent
 * interactive transactions queue for the connection. Under Prisma's 2s
 * default wait the later ones failed with "Unable to start a transaction in
 * the given time"; the shared client must let all of them finish.
 *
 * Reads nothing and writes nothing: each transaction only sleeps.
 */
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";

describe("shared Prisma client", () => {
  it("completes concurrent interactive transactions that queue past 2s", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT pg_sleep(0.4)::text AS slept`;
          return true;
        }),
      ),
    );

    const failures = results.filter((result) => result.status === "rejected");
    expect(failures).toEqual([]);
  });
});
