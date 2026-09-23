import "server-only";
import { headers } from "next/headers";

import { consumeRateLimit } from "@/lib/rate-limit";

const AUTH_RATE_LIMITS = {
  register: { limit: 5, windowMs: 10 * 60 * 1000 },
  // Raised from 10 in Phase 7: this bucket is shared by every request
  // whose IP resolves the same way (in local/E2E runs every request comes
  // from the same loopback address — Next's server fills
  // `x-forwarded-for` from the socket — so every login attempt collapses
  // into one bucket; see getRequestIp() below). D-022 established
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

/**
 * Test-environment-only exemption for the `login` bucket (D-030's
 * documented next escalation, see docs/DECISIONS.md D-055). The E2E suite
 * performs ~42 real logins per run, all from one address against one
 * in-memory bucket — far past 30 per 10 minutes. `playwright.config.ts`
 * sets `E2E_AUTH_LOGIN_RATE_LIMIT` on the dev server it launches.
 *
 * Fail-closed: honored ONLY when `NODE_ENV === "development"` (what
 * `next dev`, which Playwright launches, sets). Every other value —
 * "production", "test", "staging", a miscased or non-standard value, or
 * unset — ignores the override, so a real deployment cannot loosen the
 * limit even if the variable were set there by mistake. It only replaces
 * the numeric ceiling; the limiter still runs.
 */
export function resolveAuthRateLimit(
  action: AuthRateLimitAction,
  env: Record<string, string | undefined> = process.env,
): { limit: number; windowMs: number } {
  const config = AUTH_RATE_LIMITS[action];
  if (action !== "login" || env.NODE_ENV !== "development") return config;

  const override = Number(env.E2E_AUTH_LOGIN_RATE_LIMIT);
  if (!Number.isInteger(override) || override < 1) return config;
  return { ...config, limit: override };
}

async function getRequestIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}

/** Returns false when the caller has exceeded the allowed attempts for this action. */
export async function checkAuthRateLimit(action: AuthRateLimitAction): Promise<boolean> {
  const ip = await getRequestIp();
  return consumeRateLimit(`auth:${action}:${ip}`, resolveAuthRateLimit(action)).allowed;
}
