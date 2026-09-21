import "server-only";

import { sniffImageFormat } from "@/lib/storage/image-format";
import {
  FileTooLargeError,
  ImageDimensionsExceededError,
  UnsupportedFileTypeError,
} from "@/lib/storage/errors";
import { GALLERY_MAX_DIMENSION_PX, GALLERY_UPLOAD_MAX_BYTES } from "@/lib/storage/limits";

export { GALLERY_MAX_DIMENSION_PX, GALLERY_UPLOAD_MAX_BYTES };

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXTENSIONS_BY_MIME: Record<string, Set<string>> = {
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
  "image/gif": new Set(["gif"]),
};

export interface ValidatedGalleryImage {
  buffer: Buffer;
  extension: string;
  contentType: string;
  width: number | null;
  height: number | null;
}

function extractExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex === -1 ? "" : fileName.slice(dotIndex + 1).toLowerCase();
}

/**
 * The authoritative server-side gate for every gallery image upload.
 * Deliberately layers four independent checks — size, claimed MIME type,
 * claimed extension, and actual file-content signature — because none of
 * the client-supplied values (`name`, `type`) can be trusted alone (a
 * client can rename `payload.exe` to `photo.jpg` and set
 * `Content-Type: image/jpeg`). The content-signature check
 * (`sniffImageFormat`) is what actually decides pass/fail; the
 * MIME/extension checks only reject an obviously-mislabeled upload early
 * with a clearer error before touching the buffer parser.
 *
 * Throws `FileTooLargeError` / `UnsupportedFileTypeError` /
 * `ImageDimensionsExceededError` — never returns a partial/best-effort
 * result.
 */
export function validateGalleryImageUpload(input: {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
}): ValidatedGalleryImage {
  if (input.size <= 0 || input.size > GALLERY_UPLOAD_MAX_BYTES) {
    throw new FileTooLargeError(GALLERY_UPLOAD_MAX_BYTES);
  }
  // Defense in depth: the size field on a File object is set by the
  // browser from the actual blob, but never trust it over the real
  // buffer length once we have it.
  if (input.buffer.length !== input.size || input.buffer.length > GALLERY_UPLOAD_MAX_BYTES) {
    throw new FileTooLargeError(GALLERY_UPLOAD_MAX_BYTES);
  }

  if (!ALLOWED_MIME_TYPES.has(input.type)) {
    throw new UnsupportedFileTypeError();
  }

  const claimedExtension = extractExtension(input.name);
  if (!ALLOWED_EXTENSIONS_BY_MIME[input.type]?.has(claimedExtension)) {
    throw new UnsupportedFileTypeError();
  }

  const sniffed = sniffImageFormat(input.buffer);
  if (!sniffed) throw new UnsupportedFileTypeError();
  // The claimed MIME type must match what the bytes actually are — a
  // `.jpg`-named, `image/jpeg`-typed file whose content is really a PNG
  // (or isn't an image at all) is rejected here, not accepted under
  // whichever label the client chose.
  if (sniffed.contentType !== input.type) throw new UnsupportedFileTypeError();

  if (
    sniffed.width !== null &&
    sniffed.height !== null &&
    (sniffed.width > GALLERY_MAX_DIMENSION_PX || sniffed.height > GALLERY_MAX_DIMENSION_PX)
  ) {
    throw new ImageDimensionsExceededError(GALLERY_MAX_DIMENSION_PX);
  }

  return {
    buffer: input.buffer,
    extension: sniffed.extension,
    contentType: sniffed.contentType,
    width: sniffed.width,
    height: sniffed.height,
  };
}
