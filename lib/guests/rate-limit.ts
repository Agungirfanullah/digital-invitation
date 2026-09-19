import "server-only";

import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * Token regeneration is an authenticated (EDITOR/OWNER) mutation, so
 * it's keyed by `userId` rather than IP (unlike `lib/rsvp/rate-limit.ts`,
 * which is public/unauthenticated) — we already know who's asking, and
 * IP-keying would unfairly bucket multiple legitimate dashboard users
 * behind the same network. 10 regenerations per 10 minutes is generous
 * for real usage (this is not something an owner does often) while
 * bounding a buggy/compromised client from hammering it.
 */
const REGENERATE_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

/**
 * Same caveat as every other limiter in this codebase
 * (`lib/rate-limit/index.ts`): in-memory, single-process only — a
 * temporary stopgap, not a substitute for a shared store under
 * multi-instance/serverless concurrency.
 */
export async function checkGuestInvitationRateLimit(userId: string): Promise<boolean> {
  return consumeRateLimit(`guest-invitation:regenerate:${userId}`, REGENERATE_LIMIT).allowed;
}
