import "server-only";

import { EventNotFoundError, mapEventErrorMessage } from "@/lib/events/errors";
import {
  FileTooLargeError,
  GalleryStorageDeletionError,
  ImageDimensionsExceededError,
  UnsupportedFileTypeError,
  mapStorageErrorMessage,
} from "@/lib/storage/errors";

// Re-exported rather than duplicated: "event doesn't exist" and "event
// exists but you can't edit it" are the exact same IDOR-safe concept
// lib/events/authorization.ts already implements — the editor domain
// reuses it instead of inventing a parallel error type.
export { EventNotFoundError };

/** Thrown when a template slug is inactive, unknown to the DB, or not yet implemented in the template registry. */
export class TemplateNotAvailableError extends Error {
  constructor() {
    super("Template is not available for selection");
    this.name = "TemplateNotAvailableError";
  }
}

/**
 * Thrown when an identity profile write doesn't match the event type's
 * identity family (e.g. a bride/groom profile for a BIRTHDAY event, any
 * profile for OTHER, or an ANNIVERSARY-only field on a WEDDING). Enforced in
 * the service, so a crafted request can't bypass the editor UI.
 */
export class IdentityFamilyMismatchError extends Error {
  constructor() {
    super("Identity profile does not match the event type");
    this.name = "IdentityFamilyMismatchError";
  }
}

/** Thrown when a section override targets a section the event type doesn't let the owner toggle. */
export class SectionNotToggleableError extends Error {
  constructor() {
    super("Section cannot be toggled for this event type");
    this.name = "SectionNotToggleableError";
  }
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";

/** Maps a domain/unexpected error to an Indonesian, user-safe message. Logs the raw error for operators. */
export function mapEditorErrorMessage(error: unknown): string {
  if (error instanceof TemplateNotAvailableError) {
    return "Template ini belum tersedia untuk dipilih.";
  }
  if (error instanceof IdentityFamilyMismatchError) {
    return "Data identitas ini tidak sesuai dengan jenis acara.";
  }
  if (error instanceof SectionNotToggleableError) {
    return "Bagian ini tidak dapat diatur untuk jenis acara ini.";
  }
  if (error instanceof EventNotFoundError) {
    return mapEventErrorMessage(error);
  }
  if (
    error instanceof FileTooLargeError ||
    error instanceof UnsupportedFileTypeError ||
    error instanceof ImageDimensionsExceededError ||
    error instanceof GalleryStorageDeletionError
  ) {
    return mapStorageErrorMessage(error);
  }

  console.error("[editor] Unexpected error", error);
  return GENERIC_MESSAGE;
}
