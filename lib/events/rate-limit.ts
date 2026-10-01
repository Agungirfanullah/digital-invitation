import "server-only";

import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * D-077 (Phase 20 Batch 1). One shared bucket per user across all five
 * event mutations (create/update/publish/unpublish/delete) — matching how
 * docs/STATUS.md names this as a single concern ("Event mutation rate
 * limiting"), not five independent ones. Reuses the exact limit/window
 * already proven for the `login` bucket (lib/auth/rate-limit.ts) rather
 * than inventing a new number: generous enough for normal dashboard
 * editing (several edits/publishes in one session) while still bounding
 * scripted abuse.
 */
const EVENT_MUTATION_RATE_LIMIT = { limit: 30, windowMs: 10 * 60 * 1000 };

/**
 * Keyed by the authenticated user's id — available at the call site right
 * after `requireAppUser()`, contains no PII (an opaque Supabase-issued
 * id), and isolates each user's own mutation rate from every other user's,
 * unlike an IP-based key (which the pre-authentication `lib/auth/
 * rate-limit.ts` precedent uses only because no user identity exists yet
 * at that point).
 */
export function checkEventMutationRateLimit(userId: string): boolean {
  return consumeRateLimit(`event-mutation:${userId}`, EVENT_MUTATION_RATE_LIMIT).allowed;
}
