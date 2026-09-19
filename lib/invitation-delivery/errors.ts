/** Thrown when no provider is registered for the requested channel — true for every channel today, since no real WhatsApp/email provider is configured (see providers.ts). */
export class DeliveryChannelNotConfiguredError extends Error {
  constructor(public readonly channel: string) {
    super(`No delivery provider is configured for channel ${channel}`);
    this.name = "DeliveryChannelNotConfiguredError";
  }
}

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";

/** Maps a domain/unexpected error to an Indonesian, user-safe message. Logs the raw error for operators — never a raw provider error to the client. */
export function mapDeliveryErrorMessage(error: unknown): string {
  if (error instanceof DeliveryChannelNotConfiguredError) {
    return "Pengiriman otomatis belum tersedia untuk kanal ini. Gunakan salin tautan/pesan secara manual.";
  }

  console.error("[invitation-delivery] Unexpected error", error);
  return GENERIC_MESSAGE;
}
