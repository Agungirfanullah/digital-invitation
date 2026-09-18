import "server-only";
import { headers } from "next/headers";

import { consumeRateLimit } from "@/lib/rate-limit";

const AUTH_RATE_LIMITS = {
  register: { limit: 5, windowMs: 10 * 60 * 1000 },
  login: { limit: 10, windowMs: 10 * 60 * 1000 },
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
