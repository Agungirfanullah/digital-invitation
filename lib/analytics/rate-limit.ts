import "server-only";
import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * Keyed by the first-party analytics session id, not IP. Unlike
 * `lib/rsvp/rate-limit.ts` (IP-keyed, appropriate for a low-frequency
 * mutation), invitation-view tracking is a high-frequency, refresh-
 * tolerant read-adjacent write, and many legitimate guests can share one
 * IP (a family's WiFi, a venue's network around the event) — IP-keying
 * would risk throttling distinct real visitors into each other. The
 * session id is already the right "one browser" unit for this specific
 * write. 20 tracked-view attempts per 5 minutes comfortably covers a
 * guest opening/refreshing the invitation repeatedly while still
 * bounding a scripted loop hitting the route with a stolen/replayed
 * cookie value.
 */
const TRACK_VIEW_LIMIT = { limit: 20, windowMs: 5 * 60 * 1000 };

export function checkAnalyticsTrackingRateLimit(sessionId: string): boolean {
  return consumeRateLimit(`analytics:view:${sessionId}`, TRACK_VIEW_LIMIT).allowed;
}
