import "server-only";

import { consumeRateLimit } from "@/lib/rate-limit";

/**
 * Gallery upload is an authenticated mutation (unlike RSVP/wish
 * submission), so it's keyed by `userId`, not IP — same convention as
 * `lib/guests/rate-limit.ts`'s token-regeneration limiter (D-028). 20
 * uploads per 10 minutes comfortably covers building out a real event
 * gallery in one sitting while bounding storage-cost abuse from a
 * compromised or malicious authenticated session.
 */
const GALLERY_UPLOAD_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 };

export async function checkGalleryUploadRateLimit(userId: string): Promise<boolean> {
  return consumeRateLimit(`gallery:upload:${userId}`, GALLERY_UPLOAD_LIMIT).allowed;
}
