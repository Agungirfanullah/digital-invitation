import "server-only";

import { consumeSharedRateLimit } from "@/lib/rate-limit/shared";

/**
 * Gallery upload is an authenticated mutation (unlike RSVP/wish
 * submission), so it's keyed by `userId`, not IP — same convention as
 * `lib/guests/rate-limit.ts`'s token-regeneration limiter (D-028). 60
 * uploads per 10 minutes covers building out a real event gallery in one
 * sitting — including selecting up to 20 photos at once, several times
 * over (each photo is its own request) — while still bounding
 * storage-cost abuse from a compromised or malicious authenticated
 * session. It was 20 while photos could only be added one by one.
 */
export const GALLERY_UPLOAD_LIMIT = { limit: 60, windowMs: 10 * 60 * 1000 };

export async function checkGalleryUploadRateLimit(userId: string): Promise<boolean> {
  return (await consumeSharedRateLimit(`gallery:upload:${userId}`, GALLERY_UPLOAD_LIMIT)).allowed;
}
