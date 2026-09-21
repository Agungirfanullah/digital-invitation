"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAppUser } from "@/lib/auth/session";
import { checkCheckInRateLimit } from "@/lib/checkin/rate-limit";
import {
  CHECKIN_RATE_LIMIT_MESSAGE,
  CheckInUnauthorizedError,
  EventNotFoundError,
  InvalidCheckInGuestError,
  mapCheckInErrorMessage,
} from "@/lib/checkin/errors";
import * as checkinService from "@/lib/checkin/service";
import {
  checkInSearchQuerySchema,
  manualCheckInSchema,
  qrCheckInSchema,
} from "@/lib/checkin/validation";
import type {
  CheckInGuestView,
  CheckInOutcome,
  CheckInPreviewResult,
  CheckInSearchResult,
} from "@/lib/checkin/types";

/**
 * Shared error → typed-outcome mapping for the two confirm actions below.
 * `EventNotFoundError` (stranger/nonexistent event, or a real member
 * whose role check itself couldn't resolve them at all) calls `notFound()`
 * — the same IDOR-safe page-level behavior every other dashboard route in
 * this codebase already uses. Every other domain error becomes a typed
 * `CheckInOutcome` the UI can render without a raw error ever reaching it.
 */
async function toOutcome(
  fn: () => Promise<{ status: "SUCCESS" | "ALREADY_CHECKED_IN"; guest: CheckInGuestView }>,
): Promise<CheckInOutcome> {
  try {
    const result = await fn();
    return result.status === "SUCCESS"
      ? { outcome: "SUCCESS", guest: result.guest }
      : { outcome: "ALREADY_CHECKED_IN", guest: result.guest };
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    if (error instanceof CheckInUnauthorizedError) {
      return { outcome: "UNAUTHORIZED", message: mapCheckInErrorMessage(error) };
    }
    if (error instanceof InvalidCheckInGuestError) {
      return { outcome: "INVALID_GUEST", message: mapCheckInErrorMessage(error) };
    }
    return { outcome: "UNEXPECTED_ERROR", message: mapCheckInErrorMessage(error) };
  }
}

/**
 * Read-only preview — shows the guest before the staff member confirms.
 * No rate limit here (not a mutation); `requireAppUser()` still runs, so
 * this is never reachable unauthenticated.
 */
export async function previewQrCheckInAction(
  eventId: string,
  formData: FormData,
): Promise<CheckInPreviewResult> {
  const user = await requireAppUser();

  const parsed = qrCheckInSchema.safeParse({ scannedValue: formData.get("scannedValue") });
  if (!parsed.success) {
    return { ok: false, error: "Kode QR tidak valid." };
  }

  try {
    const guest = await checkinService.previewQrCheckIn(eventId, user.id, parsed.data.scannedValue);
    return { ok: true, guest };
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { ok: false, error: mapCheckInErrorMessage(error) };
  }
}

/**
 * Confirms a QR check-in — re-validates and re-resolves the scanned value
 * again server-side (see `lib/checkin/service.ts`'s `confirmQrCheckIn()`
 * doc comment); never accepts a client-echoed guestId for this path.
 */
export async function confirmQrCheckInAction(
  eventId: string,
  formData: FormData,
): Promise<CheckInOutcome> {
  const user = await requireAppUser();

  if (!(await checkCheckInRateLimit(user.id))) {
    return { outcome: "RATE_LIMITED", message: CHECKIN_RATE_LIMIT_MESSAGE };
  }

  const parsed = qrCheckInSchema.safeParse({ scannedValue: formData.get("scannedValue") });
  if (!parsed.success) {
    return {
      outcome: "VALIDATION_ERROR",
      message: "Kode QR tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await toOutcome(() =>
    checkinService.confirmQrCheckIn(eventId, user.id, parsed.data.scannedValue),
  );
  if (result.outcome === "SUCCESS") {
    revalidatePath(`/dashboard/events/${eventId}/check-in`);
  }
  return result;
}

/** Read-only preview for the manual path — same shape as previewQrCheckInAction. */
export async function previewManualCheckInAction(
  eventId: string,
  formData: FormData,
): Promise<CheckInPreviewResult> {
  const user = await requireAppUser();

  const parsed = manualCheckInSchema.safeParse({ guestId: formData.get("guestId") });
  if (!parsed.success) {
    return { ok: false, error: "Pilih tamu terlebih dahulu." };
  }

  try {
    const guest = await checkinService.previewManualCheckIn(eventId, user.id, parsed.data.guestId);
    return { ok: true, guest };
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { ok: false, error: mapCheckInErrorMessage(error) };
  }
}

/** Confirms a manual check-in — the server always re-verifies `{ guestId, eventId }` before writing, never trusts the id alone. */
export async function confirmManualCheckInAction(
  eventId: string,
  formData: FormData,
): Promise<CheckInOutcome> {
  const user = await requireAppUser();

  if (!(await checkCheckInRateLimit(user.id))) {
    return { outcome: "RATE_LIMITED", message: CHECKIN_RATE_LIMIT_MESSAGE };
  }

  const parsed = manualCheckInSchema.safeParse({ guestId: formData.get("guestId") });
  if (!parsed.success) {
    return {
      outcome: "VALIDATION_ERROR",
      message: "Pilih tamu terlebih dahulu.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await toOutcome(() =>
    checkinService.confirmManualCheckIn(eventId, user.id, parsed.data.guestId),
  );
  if (result.outcome === "SUCCESS") {
    revalidatePath(`/dashboard/events/${eventId}/check-in`);
  }
  return result;
}

/**
 * Event-scoped guest search for the manual-check-in path. A plain,
 * non-`useActionState` async Server Action (matching the search-as-you-
 * type pattern this call site needs) — never a Route Handler, since this
 * is authenticated dashboard data, not something to expose as a fetchable
 * URL.
 */
export async function searchGuestsForCheckInAction(
  eventId: string,
  query: string,
): Promise<CheckInSearchResult> {
  const user = await requireAppUser();

  const parsed = checkInSearchQuerySchema.safeParse({ q: query });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten().fieldErrors.q?.[0] ?? "Kata kunci tidak valid.",
    };
  }

  try {
    const results = await checkinService.searchGuestsForCheckIn(eventId, user.id, parsed.data.q);
    return { ok: true, results };
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { ok: false, error: mapCheckInErrorMessage(error) };
  }
}
