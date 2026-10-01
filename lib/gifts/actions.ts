"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAppUser } from "@/lib/auth/session";
import { giftMethodInputSchema } from "@/lib/gifts/validation";
import {
  createGiftMethodForUser,
  deleteGiftMethodForUser,
  updateGiftMethodForUser,
} from "@/lib/gifts/service";
import {
  EventNotFoundError,
  GiftMethodNotFoundError,
  mapGiftErrorMessage,
} from "@/lib/gifts/errors";
import { checkGiftMutationRateLimit } from "@/lib/gifts/rate-limit";

export interface GiftMethodFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const RATE_LIMIT_MESSAGE = "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.";

function parseGiftMethodFormData(formData: FormData) {
  return {
    type: formData.get("type"),
    providerName: formData.get("providerName") || null,
    accountName: formData.get("accountName") || null,
    accountNumber: formData.get("accountNumber") || null,
    qrImageUrl: formData.get("qrImageUrl") || null,
    instructions: formData.get("instructions") || null,
    isActive: formData.get("isActive"),
  };
}

export async function createGiftMethodAction(
  eventId: string,
  _prevState: GiftMethodFormState,
  formData: FormData,
): Promise<GiftMethodFormState> {
  const user = await requireAppUser();

  if (!checkGiftMutationRateLimit(user.id)) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const parsed = giftMethodInputSchema.safeParse(parseGiftMethodFormData(formData));
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createGiftMethodForUser(eventId, user.id, parsed.data);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { error: mapGiftErrorMessage(error) };
  }

  revalidatePath(`/dashboard/events/${eventId}/gifts`);
  redirect(`/dashboard/events/${eventId}/gifts`);
}

export async function updateGiftMethodAction(
  eventId: string,
  giftMethodId: string,
  _prevState: GiftMethodFormState,
  formData: FormData,
): Promise<GiftMethodFormState> {
  const user = await requireAppUser();

  if (!checkGiftMutationRateLimit(user.id)) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const parsed = giftMethodInputSchema.safeParse(parseGiftMethodFormData(formData));
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateGiftMethodForUser(eventId, user.id, giftMethodId, parsed.data);
  } catch (error) {
    if (error instanceof EventNotFoundError || error instanceof GiftMethodNotFoundError) {
      notFound();
    }
    return { error: mapGiftErrorMessage(error) };
  }

  revalidatePath(`/dashboard/events/${eventId}/gifts`);
  redirect(`/dashboard/events/${eventId}/gifts`);
}

export async function deleteGiftMethodAction(
  eventId: string,
  giftMethodId: string,
  _prevState: GiftMethodFormState,
  _formData: FormData,
): Promise<GiftMethodFormState> {
  const user = await requireAppUser();

  if (!checkGiftMutationRateLimit(user.id)) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  try {
    await deleteGiftMethodForUser(eventId, user.id, giftMethodId);
  } catch (error) {
    if (error instanceof EventNotFoundError || error instanceof GiftMethodNotFoundError) {
      notFound();
    }
    return { error: mapGiftErrorMessage(error) };
  }

  revalidatePath(`/dashboard/events/${eventId}/gifts`);
  redirect(`/dashboard/events/${eventId}/gifts`);
}
