import "server-only";
import { headers } from "next/headers";

import { consumeRateLimit } from "@/lib/rate-limit";

const AUTH_RATE_LIMITS = {
  register: { limit: 5, windowMs: 10 * 60 * 1000 },
  // Raised from 10 in Phase 7: this bucket is shared by every request
  // whose IP resolves the same way (in local/E2E runs, `x-forwarded-for`/
  // `x-real-ip` are both absent, so every login attempt collapses into
  // one "unknown" bucket — see getRequestIp() below). D-022 established
  // that later phases would keep adding real authenticated E2E logins;
  // by Phase 6 the combined suite already sat at exactly 10 login
  // attempts per run, and Phase 7's additional tests pushed it over,
  // breaking unrelated Phase 5/6 specs through this shared bucket. 30
  // still meaningfully throttles credential-stuffing (Supabase Auth's
  // own server-side protections are the primary defense against
  // password-guessing regardless of this app-level limiter) while
  // leaving headroom for the E2E strategy this project has deliberately
  // committed to. See docs/DECISIONS.md.
  login: { limit: 30, windowMs: 10 * 60 * 1000 },
  "password-reset": { limit: 5, windowMs: 15 * 60 * 1000 },
} as const;

export type AuthRateLimitAction = keyof typeof AUTH_RATE_LIMITS;

async function getRequestIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

/** Returns false when the caller has exceeded the allowed attempts for this action. */
export async function checkAuthRateLimit(action: AuthRateLimitAction): Promise<boolean> {
  const ip = await getRequestIp();
  const config = AUTH_RATE_LIMITS[action];
  return consumeRateLimit(`auth:${action}:${ip}`, config).allowed;
}
