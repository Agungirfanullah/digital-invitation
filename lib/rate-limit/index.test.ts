import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { consumeRateLimit, resetRateLimit } from "@/lib/rate-limit";

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
