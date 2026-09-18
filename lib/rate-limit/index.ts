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
 * In-memory fixed-window rate limiter. This only coordinates within a
 * single running process/serverless instance — it is a first line of
 * defense, not a substitute for a shared store. Replace with a
 * Redis-backed (or similar) implementation before relying on it across
 * multiple instances in production. See docs/ARCHITECTURE.md §28.
 */
export function consumeRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
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
