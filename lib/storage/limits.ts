/**
 * Deliberately its own module with no `server-only` import (unlike
 * `lib/storage/validation.ts`) — these constants need to be readable from
 * a Client Component (the upload form's "max size" copy/client-side
 * pre-check) without pulling the server-only validation/Storage-provider
 * module graph into the browser bundle.
 */

/**
 * 5MB — generous for a phone-camera photo (even a high-resolution JPEG is
 * typically 2-4MB) while still bounding per-upload storage cost/abuse.
 * Also drives `next.config.ts`'s Server Actions `bodySizeLimit`, which
 * must stay comfortably above this to leave room for multipart/form
 * overhead.
 */
export const GALLERY_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

/** Defends against a decompression-bomb-style pixel count even from a small file; no real event photo needs a dimension this large. */
export const GALLERY_MAX_DIMENSION_PX = 8000;
