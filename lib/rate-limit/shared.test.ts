import { describe, expect, it } from "vitest";

import { consumeSharedRateLimit, usesSharedStore } from "@/lib/rate-limit/shared";

describe("usesSharedStore", () => {
  it("is on for a real deployment", () => {
    expect(usesSharedStore({ NODE_ENV: "production" })).toBe(true);
    expect(usesSharedStore({})).toBe(true);
  });

  it("stays off under test runners and the E2E server, so they leave no shared counters behind", () => {
    expect(usesSharedStore({ NODE_ENV: "test" })).toBe(false);
    expect(usesSharedStore({ NODE_ENV: "production", E2E_TEST_MODE: "true" })).toBe(false);
  });

  it("is not switched off by lookalike values of the E2E flag", () => {
    for (const value of ["True", "1", "yes", "false", ""]) {
      expect(usesSharedStore({ NODE_ENV: "production", E2E_TEST_MODE: value }), value).toBe(true);
    }
  });
});

describe("consumeSharedRateLimit under test", () => {
  it("limits per key using the in-memory store", async () => {
    const key = `shared-test:${Math.random()}`;
    const options = { limit: 2, windowMs: 60_000 };

    expect((await consumeSharedRateLimit(key, options)).allowed).toBe(true);
    expect((await consumeSharedRateLimit(key, options)).allowed).toBe(true);
    expect((await consumeSharedRateLimit(key, options)).allowed).toBe(false);
    expect((await consumeSharedRateLimit(`${key}:other`, options)).allowed).toBe(true);
  });
});
