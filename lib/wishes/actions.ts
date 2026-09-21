"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAppUser } from "@/lib/auth/session";
import {
  EventNotFoundError,
  WISH_RATE_LIMIT_MESSAGE,
  WishNotFoundError,
  mapWishErrorMessage,
} from "@/lib/wishes/errors";
import { checkWishRateLimit } from "@/lib/wishes/rate-limit";
import {
  approveWishForUser,
  deleteWishForUser,
  hideWishForUser,
  submitWishForGuest,
} from "@/lib/wishes/service";
import { wishFormSchema } from "@/lib/wishes/validation";
import type { WishFormState } from "@/lib/wishes/types";

/**
 * Public, unauthenticated Server Action — reachable by anyone who knows an
 * `eventId` and can guess/replay a token, so it independently re-validates
 * and re-resolves everything itself. `eventId` and `token` are bound
 * server-side by the caller (the invitation page, from the already-resolved
 * slug and the `?to=` query value) — this action never accepts a guestId,
 * and never trusts anything else from the client for identity. Matches
 * `lib/rsvp/actions.ts`'s `submitRsvpAction`.
 */
export async function submitWishAction(
  eventId: string,
  token: string,
  _prevState: WishFormState,
  formData: FormData,
): Promise<WishFormState> {
  if (!(await checkWishRateLimit())) {
    return { status: "error", error: WISH_RATE_LIMIT_MESSAGE };
  }

  const parsed = wishFormSchema.safeParse({
    name: formData.get("name"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: "Periksa kembali ucapan Anda.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await submitWishForGuest(eventId, token, parsed.data);
    return { status: "success" };
  } catch (error) {
    return { status: "error", error: mapWishErrorMessage(error) };
  }
}

export interface WishModerationFormState {
  error?: string;
}

/**
 * These three actions are always invoked inline from the moderation list
 * itself (`app/dashboard/events/[eventId]/wishes`), not a separate
 * create/edit page — so, unlike `lib/gifts/actions.ts`, they revalidate
 * and re-render the same page rather than redirecting, matching
 * `components/events/publish-toggle-button.tsx`'s inline-toggle pattern.
 */
export async function approveWishAction(
  eventId: string,
  wishId: string,
  _prevState: WishModerationFormState,
  _formData: FormData,
): Promise<WishModerationFormState> {
  const user = await requireAppUser();

  try {
    await approveWishForUser(eventId, user.id, wishId);
  } catch (error) {
    if (error instanceof EventNotFoundError || error instanceof WishNotFoundError) notFound();
    return { error: mapWishErrorMessage(error) };
  }

  revalidatePath(`/dashboard/events/${eventId}/wishes`);
  return {};
}

export async function hideWishAction(
  eventId: string,
  wishId: string,
  _prevState: WishModerationFormState,
  _formData: FormData,
): Promise<WishModerationFormState> {
  const user = await requireAppUser();

  try {
    await hideWishForUser(eventId, user.id, wishId);
  } catch (error) {
    if (error instanceof EventNotFoundError || error instanceof WishNotFoundError) notFound();
    return { error: mapWishErrorMessage(error) };
  }

  revalidatePath(`/dashboard/events/${eventId}/wishes`);
  return {};
}

export async function deleteWishAction(
  eventId: string,
  wishId: string,
  _prevState: WishModerationFormState,
  _formData: FormData,
): Promise<WishModerationFormState> {
  const user = await requireAppUser();

  try {
    await deleteWishForUser(eventId, user.id, wishId);
  } catch (error) {
    if (error instanceof EventNotFoundError || error instanceof WishNotFoundError) notFound();
    return { error: mapWishErrorMessage(error) };
  }

  revalidatePath(`/dashboard/events/${eventId}/wishes`);
  return {};
}
