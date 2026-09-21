import "server-only";
import { EventNotFoundError, mapEventErrorMessage } from "@/lib/events/errors";

export { EventNotFoundError };

/**
 * Thrown when a wish id doesn't exist within an (already-authorized)
 * event — deliberately the same shape/handling as `GiftMethodNotFoundError`
 * so a caller can't distinguish "no such wish" from "wish belongs to a
 * different event" (IDOR: both must look identical).
 */
export class WishNotFoundError extends Error {
  constructor() {
    super("Wish not found in this event");
    this.name = "WishNotFoundError";
  }
}

/**
 * Thrown when a token is malformed, unknown, or belongs to a guest from a
 * different event — deliberately one error for all three cases, matching
 * `InvalidRsvpTokenError`'s doc comment (IDOR: a caller must not be able to
 * distinguish "no such token" from "token for another event").
 */
export class InvalidWishTokenError extends Error {
  constructor() {
    super("Wish token is invalid or does not belong to this event");
    this.name = "InvalidWishTokenError";
  }
}

/** docs/DECISIONS.md D-038: a per-guest cap on non-deleted wishes, enforced as a plain count check against the existing schema. */
export class WishLimitExceededError extends Error {
  constructor(public readonly limit: number) {
    super(`Guest has already submitted the maximum of ${limit} wishes for this event`);
    this.name = "WishLimitExceededError";
  }
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";
export const WISH_RATE_LIMIT_MESSAGE =
  "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.";

/** Maps a domain/unexpected error to an Indonesian, user-safe message. Logs the raw error for operators — never the submitted field values. */
export function mapWishErrorMessage(error: unknown): string {
  if (error instanceof WishLimitExceededError) {
    return "Anda sudah mengirimkan beberapa ucapan untuk acara ini. Batas maksimal ucapan telah tercapai.";
  }
  if (error instanceof InvalidWishTokenError) {
    return "Tautan undangan tidak valid. Silakan gunakan tautan undangan pribadi Anda untuk mengirim ucapan.";
  }
  if (error instanceof WishNotFoundError) {
    return "Ucapan tidak ditemukan.";
  }
  if (error instanceof EventNotFoundError) {
    return mapEventErrorMessage(error);
  }

  console.error("[wishes] Unexpected error", error);
  return GENERIC_MESSAGE;
}
