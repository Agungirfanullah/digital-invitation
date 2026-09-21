import "server-only";

import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * Check-in is an authenticated, event-scoped mutation (not a public
 * one), so — like `lib/guests/rate-limit.ts`'s token-regeneration limiter
 * and `lib/editor/gallery-rate-limit.ts`'s upload limiter — it's keyed by
 * `userId`, not IP. 300 attempts per 10 minutes (~1 every 2 seconds
 * sustained) comfortably covers a genuinely busy reception line scanning
 * guests back-to-back, while still bounding abuse from a compromised or
 * runaway automated session. Same documented single-process caveat as
 * every other limiter in this codebase (docs/ARCHITECTURE.md §28).
 */
const CHECKIN_LIMIT = { limit: 300, windowMs: 10 * 60 * 1000 };

export async function checkCheckInRateLimit(userId: string): Promise<boolean> {
  return consumeRateLimit(`checkin:submit:${userId}`, CHECKIN_LIMIT).allowed;
}
