import "server-only";
import { EventNotFoundError, mapEventErrorMessage } from "@/lib/events/errors";

export { EventNotFoundError };

/**
 * Covers a malformed/unreadable QR payload, an unknown invitation token,
 * a token whose guest belongs to a different event, AND an unknown or
 * cross-event `guestId` from the manual-search path — deliberately one
 * error for all of these, matching `InvalidRsvpTokenError`'s established
 * IDOR-safe precedent: a caller must never be able to distinguish
 * "doesn't exist" from "belongs to another event."
 */
export class InvalidCheckInGuestError extends Error {
  constructor() {
    super("Guest could not be resolved for check-in in this event");
    this.name = "InvalidCheckInGuestError";
  }
}

/**
 * Thrown when the caller is a real, authenticated member of the event
 * (so `getAuthorizedEvent` already succeeded at VIEWER level for the
 * dashboard page itself) but their role is below EDITOR — i.e. VIEWER —
 * and they reach the mutation directly. Distinct from `EventNotFoundError`
 * on purpose: unlike cross-event IDOR (where "not authorized" and
 * "doesn't exist" must look identical to an outsider), this is a
 * same-event member hitting a role boundary they can already see in the
 * UI, so a clear message is safe and expected UX here.
 */
export class CheckInUnauthorizedError extends Error {
  constructor() {
    super("Caller does not have EDITOR-or-above access for this event");
    this.name = "CheckInUnauthorizedError";
  }
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";
export const CHECKIN_RATE_LIMIT_MESSAGE =
  "Terlalu banyak percobaan check-in dalam waktu singkat. Coba lagi beberapa saat lagi.";

/** Maps a domain/unexpected error to an Indonesian, user-safe message. Logs the raw error server-side — never a raw token or Prisma error to the client. */
export function mapCheckInErrorMessage(error: unknown): string {
  if (error instanceof InvalidCheckInGuestError) {
    return "Tamu tidak ditemukan untuk acara ini.";
  }
  if (error instanceof CheckInUnauthorizedError) {
    return "Anda tidak memiliki izin untuk melakukan check-in pada acara ini.";
  }
  if (error instanceof EventNotFoundError) {
    return mapEventErrorMessage(error);
  }

  console.error("[checkin] Unexpected error", error);
  return GENERIC_MESSAGE;
}
