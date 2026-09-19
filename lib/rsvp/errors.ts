import "server-only";
import { EventNotFoundError, mapEventErrorMessage } from "@/lib/events/errors";

export { EventNotFoundError };

/**
 * Thrown when a token is malformed, unknown, or belongs to a guest from a
 * different event — deliberately one error for all three cases, so a
 * caller (and the message shown to a visitor) can never distinguish
 * "no such token" from "token for another event" (IDOR: both must look
 * identical).
 */
export class InvalidRsvpTokenError extends Error {
  constructor() {
    super("RSVP token is invalid or does not belong to this event");
    this.name = "InvalidRsvpTokenError";
  }
}

/** `docs/DATABASE.md` §16 business rule: attendeeCount must never exceed the guest's own seat quota. */
export class SeatQuotaExceededError extends Error {
  constructor(public readonly seatQuota: number) {
    super(`Attendee count exceeds seat quota of ${seatQuota}`);
    this.name = "SeatQuotaExceededError";
  }
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";
export const RSVP_RATE_LIMIT_MESSAGE =
  "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.";

/** Maps a domain/unexpected error to an Indonesian, user-safe message. Logs the raw error for operators. */
export function mapRsvpErrorMessage(error: unknown): string {
  if (error instanceof SeatQuotaExceededError) {
    return `Jumlah tamu tidak boleh melebihi kuota kursi Anda (maksimal ${error.seatQuota} orang).`;
  }
  if (error instanceof InvalidRsvpTokenError) {
    return "Tautan undangan tidak valid. Silakan gunakan tautan undangan pribadi Anda untuk mengisi RSVP.";
  }
  if (error instanceof EventNotFoundError) {
    return mapEventErrorMessage(error);
  }

  console.error("[rsvp] Unexpected error", error);
  return GENERIC_MESSAGE;
}
