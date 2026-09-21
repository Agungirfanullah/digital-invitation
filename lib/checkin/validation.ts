import { z } from "zod";

/**
 * The raw decoded QR payload — untrusted client input. Deliberately not
 * `guestTokenSchema` itself: the client sends whatever the camera
 * decoded (expected to be the full invitation URL), and
 * `lib/checkin/token.ts`'s `extractInvitationTokenFromScannedValue()`
 * does the actual token extraction/validation server-side. This schema
 * only bounds the raw string's length before it reaches that parser.
 */
export const qrCheckInSchema = z.object({
  scannedValue: z
    .string()
    .trim()
    .min(1, "Kode QR tidak terbaca.")
    .max(2000, "Kode QR tidak valid."),
});

export type QrCheckInInput = z.infer<typeof qrCheckInSchema>;

/** Manual check-in accepts a guestId — always re-verified `{ id, eventId }` server-side, never trusted alone (see lib/checkin/service.ts). */
export const manualCheckInSchema = z.object({
  guestId: z.string().trim().min(1, "Pilih tamu terlebih dahulu."),
});

export type ManualCheckInInput = z.infer<typeof manualCheckInSchema>;

export const checkInSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "Masukkan nama, telepon, atau email untuk mencari.")
    .max(100, "Kata kunci pencarian maksimal 100 karakter."),
});

export type CheckInSearchQueryInput = z.infer<typeof checkInSearchQuerySchema>;
