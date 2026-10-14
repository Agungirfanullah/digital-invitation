/**
 * Pure helpers behind the gallery's multi-photo upload. Deliberately no
 * `server-only` import: the upload form (a Client Component) uses them for
 * its pre-checks. These checks only spare a round trip — every file is
 * validated again on the server (`validateGalleryImageUpload`), which stays
 * the real gate.
 */

export const MAX_FILES_PER_BATCH = 20;

export const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type UploadEntryStatus = "ready" | "uploading" | "done" | "error";

export interface UploadEntry {
  id: string;
  name: string;
  size: number;
  status: UploadEntryStatus;
  error?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** A reason a file can be rejected before sending, or `null` if it may be uploaded. */
export function precheckFile(
  file: { type: string; size: number },
  maxBytes: number,
): string | null {
  if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type)) {
    return "Format tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.";
  }
  if (file.size === 0) return "Berkas kosong.";
  if (file.size > maxBytes) {
    return `Ukuran melebihi ${Math.round(maxBytes / (1024 * 1024))}MB.`;
  }
  return null;
}

/** Keeps the first `max` items; `dropped` is how many were left out. */
export function limitBatch<T>(items: readonly T[], max: number): { kept: T[]; dropped: number } {
  return { kept: items.slice(0, max), dropped: Math.max(0, items.length - max) };
}

export function countByStatus(entries: readonly UploadEntry[]): Record<UploadEntryStatus, number> {
  const counts: Record<UploadEntryStatus, number> = { ready: 0, uploading: 0, done: 0, error: 0 };
  for (const entry of entries) counts[entry.status] += 1;
  return counts;
}

/** The sentence announced and shown while uploading and when the batch ends. */
export function describeBatch(entries: readonly UploadEntry[], uploading: boolean): string {
  const counts = countByStatus(entries);
  const total = counts.ready + counts.uploading + counts.done + counts.error;
  if (total === 0) return "";

  if (uploading) {
    const position = Math.min(total, counts.done + counts.error + 1);
    return `Mengunggah ${position} dari ${total}...`;
  }

  // Nothing has been sent yet: describe the selection, not an outcome.
  if (counts.done === 0) {
    if (counts.ready === 0) return "Tidak ada berkas yang bisa diunggah.";
    return counts.error > 0
      ? `${counts.ready} berkas siap diunggah, ${counts.error} tidak bisa diunggah.`
      : `${counts.ready} berkas siap diunggah.`;
  }

  const parts: string[] = [];
  if (counts.done > 0) parts.push(`${counts.done} foto berhasil diunggah`);
  if (counts.error > 0) parts.push(`${counts.error} gagal`);
  if (counts.ready > 0 && counts.done + counts.error > 0) {
    parts.push(`${counts.ready} belum diunggah`);
  }
  return parts.length > 0 ? `${parts.join(", ")}.` : "";
}
