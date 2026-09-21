import "server-only";

/** The uploaded file exceeds GALLERY_UPLOAD_MAX_BYTES. */
export class FileTooLargeError extends Error {
  constructor(public readonly maxBytes: number) {
    super(`File exceeds the maximum upload size of ${maxBytes} bytes`);
    this.name = "FileTooLargeError";
  }
}

/**
 * Thrown for a claimed MIME type outside the allowlist, an extension that
 * doesn't match an allowed image type, OR — the actual authenticity
 * check — file content whose magic bytes don't match any recognized image
 * format (see lib/storage/image-format.ts). One error for all three cases
 * on purpose: a caller/UI should never need to distinguish "wrong
 * extension" from "this isn't really an image," since both are the same
 * user-facing outcome (upload rejected).
 */
export class UnsupportedFileTypeError extends Error {
  constructor() {
    super("File is not a supported image type");
    this.name = "UnsupportedFileTypeError";
  }
}

/** A recognized image format whose decoded pixel dimensions exceed GALLERY_MAX_DIMENSION_PX. */
export class ImageDimensionsExceededError extends Error {
  constructor(public readonly maxDimensionPx: number) {
    super(`Image dimensions exceed the maximum of ${maxDimensionPx}px`);
    this.name = "ImageDimensionsExceededError";
  }
}

/**
 * Thrown when a gallery image's storage object could not be removed —
 * deletion is aborted (the DB row is left in place) rather than reporting
 * a false "deleted" outcome that would silently orphan the storage
 * object. See docs/DECISIONS.md D-040.
 */
export class GalleryStorageDeletionError extends Error {
  constructor() {
    super("Failed to remove the gallery item's storage object");
    this.name = "GalleryStorageDeletionError";
  }
}

/** Wraps an unexpected failure from the storage provider (network error, bucket misconfiguration, etc.) — never surfaced to the client verbatim. */
export class StorageProviderError extends Error {
  constructor(cause: unknown) {
    super("Storage provider operation failed");
    this.name = "StorageProviderError";
    this.cause = cause;
  }
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";
export const GALLERY_UPLOAD_RATE_LIMIT_MESSAGE =
  "Terlalu banyak unggahan dalam waktu singkat. Coba lagi beberapa saat lagi.";

/** Maps a domain/unexpected storage error to an Indonesian, user-safe message. Logs the raw error for operators — never a raw provider/SDK error string to the client. */
export function mapStorageErrorMessage(error: unknown): string {
  if (error instanceof FileTooLargeError) {
    const maxMb = (error.maxBytes / (1024 * 1024)).toFixed(0);
    return `Ukuran berkas melebihi batas maksimal ${maxMb}MB.`;
  }
  if (error instanceof UnsupportedFileTypeError) {
    return "Berkas harus berupa gambar JPEG, PNG, WebP, atau GIF yang valid.";
  }
  if (error instanceof ImageDimensionsExceededError) {
    return `Dimensi gambar melebihi batas maksimal ${error.maxDimensionPx}px.`;
  }
  if (error instanceof GalleryStorageDeletionError) {
    return "Gagal menghapus berkas dari penyimpanan. Coba lagi beberapa saat lagi.";
  }

  console.error("[storage] Unexpected error", error);
  return GENERIC_MESSAGE;
}
