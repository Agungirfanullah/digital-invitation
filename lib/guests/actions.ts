"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAppUser } from "@/lib/auth/session";
import { guestInputSchema } from "@/lib/guests/validation";
import {
  confirmGuestImport,
  createGuestForUser,
  deleteGuestForUser,
  previewGuestImport,
  updateGuestForUser,
} from "@/lib/guests/service";
import { EventNotFoundError, GuestNotFoundError, mapGuestErrorMessage } from "@/lib/guests/errors";
import type { CsvImportPreview, CsvImportSummary } from "@/lib/guests/types";

export interface GuestFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseGuestFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
    category: formData.get("category"),
    seatQuota: formData.get("seatQuota"),
    notes: formData.get("notes") || null,
  };
}

export async function createGuestAction(
  eventId: string,
  _prevState: GuestFormState,
  formData: FormData,
): Promise<GuestFormState> {
  const user = await requireAppUser();

  const parsed = guestInputSchema.safeParse(parseGuestFormData(formData));
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createGuestForUser(eventId, user.id, parsed.data);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { error: mapGuestErrorMessage(error) };
  }

  revalidatePath(`/dashboard/events/${eventId}/guests`);
  redirect(`/dashboard/events/${eventId}/guests`);
}

export async function updateGuestAction(
  eventId: string,
  guestId: string,
  _prevState: GuestFormState,
  formData: FormData,
): Promise<GuestFormState> {
  const user = await requireAppUser();

  const parsed = guestInputSchema.safeParse(parseGuestFormData(formData));
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateGuestForUser(eventId, user.id, guestId, parsed.data);
  } catch (error) {
    if (error instanceof EventNotFoundError || error instanceof GuestNotFoundError) notFound();
    return { error: mapGuestErrorMessage(error) };
  }

  revalidatePath(`/dashboard/events/${eventId}/guests`);
  redirect(`/dashboard/events/${eventId}/guests`);
}

export async function deleteGuestAction(
  eventId: string,
  guestId: string,
  _prevState: GuestFormState,
  _formData: FormData,
): Promise<GuestFormState> {
  const user = await requireAppUser();

  try {
    await deleteGuestForUser(eventId, user.id, guestId);
  } catch (error) {
    if (error instanceof EventNotFoundError || error instanceof GuestNotFoundError) notFound();
    return { error: mapGuestErrorMessage(error) };
  }

  revalidatePath(`/dashboard/events/${eventId}/guests`);
  redirect(`/dashboard/events/${eventId}/guests`);
}

export interface ImportPreviewState {
  error?: string;
  preview?: CsvImportPreview;
  csvText?: string;
}

/** Step 1 of CSV import: parse + validate + flag duplicates, write nothing yet. */
export async function previewGuestImportAction(
  eventId: string,
  _prevState: ImportPreviewState,
  formData: FormData,
): Promise<ImportPreviewState> {
  const user = await requireAppUser();
  const csvText = String(formData.get("csvText") ?? "");

  if (!csvText.trim()) {
    return { error: "Pilih atau tempel data CSV terlebih dahulu." };
  }

  try {
    const preview = await previewGuestImport(eventId, user.id, csvText);
    return { preview, csvText };
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { error: mapGuestErrorMessage(error) };
  }
}

export interface ImportConfirmState {
  error?: string;
  summary?: CsvImportSummary;
}

/**
 * Step 2: re-parses and re-validates the same CSV text from scratch
 * (never trusts the preview step's result as already-safe) before writing
 * anything, so a tampered/replayed confirm request can't smuggle in a row
 * the preview never actually approved.
 */
export async function confirmGuestImportAction(
  eventId: string,
  _prevState: ImportConfirmState,
  formData: FormData,
): Promise<ImportConfirmState> {
  const user = await requireAppUser();
  const csvText = String(formData.get("csvText") ?? "");

  if (!csvText.trim()) {
    return { error: "Data CSV tidak ditemukan. Ulangi proses impor dari awal." };
  }

  try {
    const summary = await confirmGuestImport(eventId, user.id, csvText);
    revalidatePath(`/dashboard/events/${eventId}/guests`);
    return { summary };
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { error: mapGuestErrorMessage(error) };
  }
}
