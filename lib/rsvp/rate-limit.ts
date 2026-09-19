import "server-only";
import { headers } from "next/headers";

import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * `docs/ARCHITECTURE.md` §28 explicitly lists RSVP as a rate-limited
 * surface. This is a public, unauthenticated mutation, so it needs its
 * own limiter distinct from `lib/auth/rate-limit.ts`'s login/register
 * buckets. 20 submissions per 10 minutes per IP is generous for the
 * legitimate case (one guest, possibly editing their answer a few times)
 * while still bounding brute-force token guessing from a single origin —
 * though the real defense against guessing is the token's own entropy
 * (192 random bits, see `lib/guests/token.ts`), not this limiter.
 */
const RSVP_SUBMIT_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 };

async function getRequestIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

/**
 * Returns false when the caller has exceeded the allowed RSVP submission
 * attempts. Same caveat as `lib/rate-limit/index.ts`: in-memory,
 * single-process only — a temporary stopgap, not a substitute for a
 * shared store under multi-instance/serverless concurrency. See
 * docs/STATUS.md's Phase 6 "Known Limitations" for the tracked follow-up.
 */
export async function checkRsvpRateLimit(): Promise<boolean> {
  const ip = await getRequestIp();
  return consumeRateLimit(`rsvp:submit:${ip}`, RSVP_SUBMIT_LIMIT).allowed;
}
