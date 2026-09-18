"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAppUser } from "@/lib/auth/session";
import { createEventSchema, updateEventSchema } from "@/lib/events/validation";
import {
  createEventForUser,
  deleteEventForUser,
  publishEventForUser,
  unpublishEventForUser,
  updateEventForUser,
} from "@/lib/events/service";
import { EventNotFoundError, mapEventErrorMessage } from "@/lib/events/errors";

export interface EventFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function parseEventFormData(formData: FormData) {
  return {
    title: formData.get("title"),
    type: formData.get("type"),
    slug: formData.get("slug"),
    // A missing/empty field resolves to `null`/`""` from FormData, but the
    // schema's optional description only accepts `undefined` — squash both
    // to `undefined` here rather than complicating the schema.
    description: formData.get("description") || undefined,
  };
}

export async function createEventAction(
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const user = await requireAppUser();

  const parsed = createEventSchema.safeParse(parseEventFormData(formData));
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let eventId: string;
  try {
    const event = await createEventForUser(user.id, parsed.data);
    eventId = event.id;
  } catch (error) {
    return { error: mapEventErrorMessage(error) };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/events/${eventId}`);
}

export async function updateEventAction(
  eventId: string,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const user = await requireAppUser();

  const parsed = updateEventSchema.safeParse(parseEventFormData(formData));
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await updateEventForUser(eventId, user.id, parsed.data);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { error: mapEventErrorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function publishEventAction(
  eventId: string,
  _prevState: EventFormState,
  _formData: FormData,
): Promise<EventFormState> {
  const user = await requireAppUser();

  try {
    await publishEventForUser(eventId, user.id);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { error: mapEventErrorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function unpublishEventAction(
  eventId: string,
  _prevState: EventFormState,
  _formData: FormData,
): Promise<EventFormState> {
  const user = await requireAppUser();

  try {
    await unpublishEventForUser(eventId, user.id);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { error: mapEventErrorMessage(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

export async function deleteEventAction(
  eventId: string,
  _prevState: EventFormState,
  _formData: FormData,
): Promise<EventFormState> {
  const user = await requireAppUser();

  try {
    await deleteEventForUser(eventId, user.id);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    return { error: mapEventErrorMessage(error) };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
