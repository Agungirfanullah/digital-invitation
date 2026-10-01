import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  consumeRateLimit,
  getRateLimitBucketCountForTesting,
  resetRateLimit,
} from "@/lib/rate-limit";

describe("consumeRateLimit", () => {
  const key = "test:127.0.0.1";

  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimit(key);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit", () => {
    for (let i = 0; i < 3; i += 1) {
      expect(consumeRateLimit(key, { limit: 3, windowMs: 1000 }).allowed).toBe(true);
    }
  });

  it("blocks requests once the limit is exceeded within the window", () => {
    for (let i = 0; i < 3; i += 1) {
      consumeRateLimit(key, { limit: 3, windowMs: 1000 });
    }
    const result = consumeRateLimit(key, { limit: 3, windowMs: 1000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets once the window elapses", () => {
    for (let i = 0; i < 3; i += 1) {
      consumeRateLimit(key, { limit: 3, windowMs: 1000 });
    }
    expect(consumeRateLimit(key, { limit: 3, windowMs: 1000 }).allowed).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(consumeRateLimit(key, { limit: 3, windowMs: 1000 }).allowed).toBe(true);
  });

  it("tracks separate keys independently", () => {
    for (let i = 0; i < 3; i += 1) {
      consumeRateLimit(key, { limit: 3, windowMs: 1000 });
    }
    expect(consumeRateLimit(key, { limit: 3, windowMs: 1000 }).allowed).toBe(false);
    expect(consumeRateLimit("test:other", { limit: 3, windowMs: 1000 }).allowed).toBe(true);
  });
});

/**
 * D-077 (Phase 20 Batch 1) eviction. The sweep is triggered internally
 * every 100 `consumeRateLimit` calls (an implementation detail, not part
 * of the public contract), so these tests force at least one sweep by
 * making 100 consecutive calls on a throwaway key — guaranteed to cross
 * the trigger at least once regardless of the module's current internal
 * call-count offset (any 100 consecutive increments must cross a multiple
 * of 100 at least once).
 */
describe("consumeRateLimit eviction", () => {
  const SWEEP_TRIGGER_CALLS = 100;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function forceSweep(throwawayKeyOptions: { limit: number; windowMs: number }): void {
    const throwawayKey = `eviction-sweep-trigger:${Math.random()}`;
    for (let i = 0; i < SWEEP_TRIGGER_CALLS; i += 1) {
      consumeRateLimit(throwawayKey, throwawayKeyOptions);
    }
  }

  it("removes expired entries once enough calls have elapsed to trigger a sweep", () => {
    const expiredKeys = Array.from(
      { length: 5 },
      (_, i) => `eviction-expired:${Math.random()}:${i}`,
    );
    for (const expiredKey of expiredKeys) {
      consumeRateLimit(expiredKey, { limit: 1, windowMs: 1 });
    }
    const countAfterCreatingExpiredKeys = getRateLimitBucketCountForTesting();

    vi.advanceTimersByTime(2); // each expired key's 1ms window has now elapsed

    // The throwaway key itself stays active throughout (long window), so
    // the net change below is attributable only to the 5 expired keys.
    forceSweep({ limit: SWEEP_TRIGGER_CALLS + 1, windowMs: 60_000 });

    const countAfterSweep = getRateLimitBucketCountForTesting();
    // -5 expired keys removed, +1 throwaway key added by forceSweep itself.
    expect(countAfterSweep).toBe(countAfterCreatingExpiredKeys - 5 + 1);
  });

  it("preserves active entries and their exact counters across a sweep", () => {
    const activeKey = `eviction-active:${Math.random()}`;
    consumeRateLimit(activeKey, { limit: 5, windowMs: 60_000 });
    consumeRateLimit(activeKey, { limit: 5, windowMs: 60_000 });
    // 2 of 5 consumed; window far in the future, so it never expires below.

    forceSweep({ limit: SWEEP_TRIGGER_CALLS + 1, windowMs: 60_000 });

    const result = consumeRateLimit(activeKey, { limit: 5, windowMs: 60_000 });
    // A reset or corrupted counter would make this 1 (fresh) instead of 3rd.
    expect(result.remaining).toBe(2);
    expect(result.allowed).toBe(true);
  });

  it("leaves an unrelated bucket's state correct after a sweep removes other expired keys", () => {
    const expiredKey = `eviction-expired-unrelated:${Math.random()}`;
    const unrelatedKey = `eviction-unrelated:${Math.random()}`;
    consumeRateLimit(expiredKey, { limit: 1, windowMs: 1 });
    consumeRateLimit(unrelatedKey, { limit: 2, windowMs: 60_000 });

    vi.advanceTimersByTime(2);
    forceSweep({ limit: SWEEP_TRIGGER_CALLS + 1, windowMs: 60_000 });

    const result = consumeRateLimit(unrelatedKey, { limit: 2, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0); // this was its 2nd of 2 — untouched by the sweep
  });

  it("behaves identically to a brand-new key when re-accessed after eviction", () => {
    const expiredKey = `eviction-reaccess:${Math.random()}`;
    consumeRateLimit(expiredKey, { limit: 1, windowMs: 1 });

    vi.advanceTimersByTime(2);
    forceSweep({ limit: SWEEP_TRIGGER_CALLS + 1, windowMs: 60_000 });

    const result = consumeRateLimit(expiredKey, { limit: 1, windowMs: 1 });
    expect(result).toEqual({ allowed: true, remaining: 0, resetAt: expect.any(Number) });
  });
});
