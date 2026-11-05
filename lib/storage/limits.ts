/**
 * Deliberately its own module with no `server-only` import (unlike
 * `lib/storage/validation.ts`) — these constants need to be readable from
 * a Client Component (the upload form's "max size" copy/client-side
 * pre-check) without pulling the server-only validation/Storage-provider
 * module graph into the browser bundle.
 */

/**
 * 4MB — enough for a phone-camera photo (a high-resolution JPEG is
 * typically 2-4MB) while bounding per-upload storage cost/abuse. It must
 * stay below Vercel's 4.5MB function request body limit: photos are sent
 * through a Server Action, and Vercel refuses a larger body before the app
 * can answer with a clear message. `next.config.ts`'s Server Actions
 * `bodySizeLimit` stays above this to leave room for multipart overhead.
 */
export const GALLERY_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

/** Defends against a decompression-bomb-style pixel count even from a small file; no real event photo needs a dimension this large. */
export const GALLERY_MAX_DIMENSION_PX = 8000;
