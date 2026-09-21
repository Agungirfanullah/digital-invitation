import "server-only";
import { headers } from "next/headers";

import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * `docs/PRD.md` §23 explicitly requires rate limiting/spam protection on
 * wish submission. This is a public, unauthenticated mutation, so it needs
 * its own limiter bucket — same pattern as `lib/rsvp/rate-limit.ts`. 10
 * submissions per 10 minutes per IP is tighter than RSVP's 20 (a guest
 * only has real reason to submit a handful of wishes, not repeatedly edit
 * one answer), while still allowing a legitimate correction or two.
 */
const WISH_SUBMIT_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };

async function getRequestIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

/**
 * Returns false when the caller has exceeded the allowed wish submission
 * attempts. Same caveat as `lib/rsvp/rate-limit.ts`: in-memory,
 * single-process only — a temporary stopgap, not a substitute for a shared
 * store under multi-instance/serverless concurrency (docs/ARCHITECTURE.md §28).
 */
export async function checkWishRateLimit(): Promise<boolean> {
  const ip = await getRequestIp();
  return consumeRateLimit(`wish:submit:${ip}`, WISH_SUBMIT_LIMIT).allowed;
}
