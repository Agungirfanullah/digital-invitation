import "server-only";

import { IdentityFamilyMismatchError, TemplateNotAvailableError } from "@/lib/editor/errors";
import { EventNotFoundError, SlugConflictError } from "@/lib/events/errors";

const GENERIC_MESSAGE = "Terjadi kesalahan. Coba lagi.";

/**
 * Maps a domain/unexpected error from `completeOnboarding()` to a safe
 * Indonesian message — reusing the existing events/editor error classes
 * rather than inventing a parallel error type, same convention as
 * `mapEventErrorMessage()`/`mapEditorErrorMessage()`.
 */
export function mapOnboardingErrorMessage(error: unknown): string {
  if (error instanceof SlugConflictError) {
    return "Nama acara ini menghasilkan tautan yang sudah dipakai. Coba ubah sedikit nama acaranya.";
  }
  if (error instanceof IdentityFamilyMismatchError) {
    return "Data yang dikirim tidak sesuai dengan jenis acara. Coba lagi dari awal.";
  }
  if (error instanceof TemplateNotAvailableError) {
    return "Template ini belum tersedia untuk dipilih.";
  }
  if (error instanceof EventNotFoundError) {
    return "Acara tidak ditemukan.";
  }

  console.error("[onboarding] Unexpected error", error);
  return GENERIC_MESSAGE;
}
