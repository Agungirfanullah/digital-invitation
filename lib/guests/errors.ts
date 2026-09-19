import "server-only";
import { EventNotFoundError, mapEventErrorMessage } from "@/lib/events/errors";

export { EventNotFoundError };

/**
 * Thrown when a guest id doesn't exist within an (already-authorized)
 * event — deliberately the same shape/handling as `EventNotFoundError` so
 * a caller can't distinguish "no such guest" from "guest belongs to a
 * different event" (IDOR: both must look identical).
 */
export class GuestNotFoundError extends Error {
  constructor() {
    super("Guest not found in this event");
    this.name = "GuestNotFoundError";
  }
}

export class CsvTooLargeError extends Error {
  constructor() {
    super("CSV payload exceeds the allowed size/row limit");
    this.name = "CsvTooLargeError";
  }
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";

/** Maps a domain/unexpected error to an Indonesian, user-safe message. Logs the raw error for operators. */
export function mapGuestErrorMessage(error: unknown): string {
  if (error instanceof GuestNotFoundError) {
    return "Tamu tidak ditemukan.";
  }
  if (error instanceof CsvTooLargeError) {
    return `File CSV terlalu besar atau berisi terlalu banyak baris (maksimal 500 baris).`;
  }
  if (error instanceof EventNotFoundError) {
    return mapEventErrorMessage(error);
  }

  console.error("[guests] Unexpected error", error);
  return GENERIC_MESSAGE;
}
