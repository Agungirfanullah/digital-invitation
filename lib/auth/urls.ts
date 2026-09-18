import "server-only";

import { getClientEnv } from "@/lib/env";

/** Only ever redirect to a relative, same-app path — never an absolute/external URL. */
export function isSafeRedirectPath(path: unknown): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export function getAppUrl(): string {
  return getClientEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

export function getAuthCallbackUrl(next: string): string {
  const safeNext = isSafeRedirectPath(next) ? next : "/dashboard";
  return `${getAppUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
