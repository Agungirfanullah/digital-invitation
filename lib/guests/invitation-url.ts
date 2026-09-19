import "server-only";

import { getAppUrl } from "@/lib/auth/urls";
import { isSafeHttpUrl } from "@/lib/invitations/url-safety";

/**
 * The single place that builds a personalized invitation URL
 * (`/invite/[slug]?to=[token]`) — used by the dashboard guest list, the
 * per-guest invitation page, and the message-preview compose step, so
 * there is exactly one definition of what this URL looks like.
 *
 * `eventSlug` and `token` must already come from a server-side,
 * authorized resolution (the caller's own event/guest lookup) — this
 * function does not itself authorize anything, it only formats a URL.
 * Never call it with a client-supplied slug/token.
 */
export function buildGuestInvitationUrl(eventSlug: string, token: string): string {
  const url = `${getAppUrl()}/invite/${eventSlug}?to=${encodeURIComponent(token)}`;

  // Defense in depth against a misconfigured NEXT_PUBLIC_APP_URL: the env
  // schema only checks `.url()` (any scheme), not http/https specifically.
  if (!isSafeHttpUrl(url)) {
    throw new Error("Constructed guest invitation URL is not a safe http(s) URL");
  }

  return url;
}
