import "server-only";

import { consumeSharedRateLimit } from "@/lib/rate-limit/shared";

/**
 * D-077 (Phase 20 Batch 1). One shared bucket per user across all three
 * gift-method mutations (create/update/delete) — same "one combined
 * concern" shape as `lib/events/rate-limit.ts`. No repository evidence
 * distinguishes gift mutations from event mutations as needing a
 * different threshold, so this reuses the identical limit/window rather
 * than inventing an unsupported distinction.
 */
const GIFT_MUTATION_RATE_LIMIT = { limit: 30, windowMs: 10 * 60 * 1000 };

/** Keyed by the authenticated user's id — see lib/events/rate-limit.ts's doc comment for the full rationale (identical here). */
export async function checkGiftMutationRateLimit(userId: string): Promise<boolean> {
  return (await consumeSharedRateLimit(`gift-mutation:${userId}`, GIFT_MUTATION_RATE_LIMIT))
    .allowed;
}
