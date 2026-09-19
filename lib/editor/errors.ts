import "server-only";

import { EventNotFoundError, mapEventErrorMessage } from "@/lib/events/errors";

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

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";

/** Maps a domain/unexpected error to an Indonesian, user-safe message. Logs the raw error for operators. */
export function mapEditorErrorMessage(error: unknown): string {
  if (error instanceof TemplateNotAvailableError) {
    return "Template ini belum tersedia untuk dipilih.";
  }
  if (error instanceof EventNotFoundError) {
    return mapEventErrorMessage(error);
  }

  console.error("[editor] Unexpected error", error);
  return GENERIC_MESSAGE;
}
