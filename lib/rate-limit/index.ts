import "server-only";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * D-077 (Phase 20 Batch 1) eviction: a bucket whose window has elapsed was
 * already logically "expired" (the `!existing || existing.resetAt <= now`
 * branch below treats it exactly like a brand-new key), but nothing ever
 * removed it from `buckets` — every key this process has ever seen stayed
 * in memory forever (docs/STATUS.md's documented "unbounded growth risk
 * for high-cardinality keys").
 *
 * Sweeping on every call would make every request pay an O(n) scan just to
 * free memory most requests don't need freed yet. Instead, a lightweight
 * call counter triggers a full sweep only every `SWEEP_INTERVAL` calls —
 * deterministic (always the Nth call, not a wall-clock timer), requires no
 * background scheduler/interval (which wouldn't reliably run between
 * invocations of a recycled serverless instance anyway), and touches the
 * public API/behavior of `consumeRateLimit`/`resetRateLimit` not at all —
 * a swept-away key is simply absent from the Map, which already behaves
 * identically to an expired-but-present one on its next access.
 */
const SWEEP_INTERVAL = 100;
let callsSinceSweep = 0;

function sweepExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * In-memory fixed-window rate limiter. This only coordinates within a
 * single running process/serverless instance — it is a first line of
 * defense, not a substitute for a shared store. Replace with a
 * Redis-backed (or similar) implementation before relying on it across
 * multiple instances in production. See docs/ARCHITECTURE.md §28.
 */
export function consumeRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  callsSinceSweep += 1;
  if (callsSinceSweep >= SWEEP_INTERVAL) {
    callsSinceSweep = 0;
    sweepExpiredBuckets(now);
  }

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt };
  }

  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: options.limit - existing.count, resetAt: existing.resetAt };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Test-support only — the number of keys currently tracked, used to prove eviction actually frees memory rather than just behaving as if it did. */
export function getRateLimitBucketCountForTesting(): number {
  return buckets.size;
}
