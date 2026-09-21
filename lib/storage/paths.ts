import "server-only";
import { randomBytes } from "node:crypto";

import { getClientEnv, getServerEnv } from "@/lib/env";

/**
 * `eventId` is always a Prisma `cuid()` in every real call site, but this
 * is still enforced defensively (never interpolate an unchecked string
 * into a storage path) — a future caller passing unsanitized input could
 * otherwise attempt a path-traversal write (`../other-event/...`).
 */
const SAFE_PATH_SEGMENT = /^[a-zA-Z0-9_-]+$/;

function assertSafePathSegment(value: string, label: string): void {
  if (!SAFE_PATH_SEGMENT.test(value)) {
    throw new Error(`Unsafe ${label} for storage path: ${JSON.stringify(value)}`);
  }
}

/**
 * Builds a deterministic, collision-safe, event-scoped object path —
 * never derived from a client-supplied filename (which could otherwise
 * collide, leak information, or attempt traversal). The random component
 * is 128 bits, effectively collision-proof for this product's scale.
 */
export function buildGalleryObjectPath(eventId: string, extension: string): string {
  assertSafePathSegment(eventId, "eventId");
  assertSafePathSegment(extension, "extension");

  const fileName = `${randomBytes(16).toString("hex")}.${extension}`;
  return `events/${eventId}/gallery/${fileName}`;
}

/**
 * The inverse of uploading: given a stored `GalleryItem.url`, recovers the
 * bucket-relative object path — but only when the URL is genuinely one of
 * our own Supabase Storage public URLs for the configured bucket. Returns
 * `null` for anything else (an externally-pasted URL from before this
 * phase, a different bucket, or a malformed value), which callers must
 * treat as "there is no storage object to delete" rather than an error —
 * see docs/DECISIONS.md D-041.
 */
export function derivePathFromPublicUrl(url: string): string | null {
  const client = getClientEnv();
  const server = getServerEnv();

  const prefix = `${client.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${server.SUPABASE_STORAGE_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;

  const path = url.slice(prefix.length);
  // Defense in depth: a well-formed object path we generated never
  // contains ".." segments or a leading slash. If it somehow does, treat
  // it as unrecoverable rather than passing a traversal-shaped string to
  // the storage provider's remove() call.
  if (path.length === 0 || path.includes("..") || path.startsWith("/")) return null;

  return path;
}
