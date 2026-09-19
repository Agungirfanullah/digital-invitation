import "server-only";
import { EventNotFoundError, mapEventErrorMessage } from "@/lib/events/errors";

export { EventNotFoundError };

/**
 * Thrown when a gift method id doesn't exist within an (already-authorized)
 * event — deliberately the same shape/handling as `EventNotFoundError` so a
 * caller can't distinguish "no such gift method" from "gift method belongs
 * to a different event" (IDOR: both must look identical).
 */
export class GiftMethodNotFoundError extends Error {
  constructor() {
    super("Gift method not found in this event");
    this.name = "GiftMethodNotFoundError";
  }
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";

/** Maps a domain/unexpected error to an Indonesian, user-safe message. Logs the raw error for operators — never the submitted field values. */
export function mapGiftErrorMessage(error: unknown): string {
  if (error instanceof GiftMethodNotFoundError) {
    return "Metode hadiah tidak ditemukan.";
  }
  if (error instanceof EventNotFoundError) {
    return mapEventErrorMessage(error);
  }

  console.error("[gifts] Unexpected error", error);
  return GENERIC_MESSAGE;
}
