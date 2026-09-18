import "server-only";

/** Thrown when an event doesn't exist OR the current user isn't authorized to see it — deliberately indistinguishable to callers, to avoid leaking cross-tenant existence (IDOR). */
export class EventNotFoundError extends Error {
  constructor() {
    super("Event not found or not accessible");
    this.name = "EventNotFoundError";
  }
}

export class SlugConflictError extends Error {
  constructor() {
    super("Event slug already in use");
    this.name = "SlugConflictError";
  }
}

/** Thrown when a delete is blocked by a restrict-on-delete relation (e.g. recorded gift transactions). */
export class EventDeleteBlockedError extends Error {
  constructor() {
    super("Event has dependent records that prevent deletion");
    this.name = "EventDeleteBlockedError";
  }
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";

/** Maps a domain/unexpected error to an Indonesian, user-safe message. Logs the raw error for operators. */
export function mapEventErrorMessage(error: unknown): string {
  if (error instanceof SlugConflictError) {
    return "Slug ini sudah digunakan. Coba slug lain.";
  }
  if (error instanceof EventDeleteBlockedError) {
    return "Acara tidak dapat dihapus karena masih memiliki data terkait (mis. transaksi hadiah).";
  }
  if (error instanceof EventNotFoundError) {
    return "Acara tidak ditemukan.";
  }

  console.error("[events] Unexpected error", error);
  return GENERIC_MESSAGE;
}
