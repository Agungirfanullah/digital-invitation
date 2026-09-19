"use server";

import { requireAppUser } from "@/lib/auth/session";
import { mapEditorErrorMessage } from "@/lib/editor/errors";
import * as editorService from "@/lib/editor/service";
import {
  galleryItemSchema,
  loveStoryItemSchema,
  loveStoryTitleSchema,
  scheduleFormSchema,
  templateSelectionSchema,
  themeSchema,
  toScheduleInput,
  weddingProfileSchema,
} from "@/lib/editor/validation";
import type { ActionResult } from "@/lib/editor/types";

/** Runs `fn` with the authenticated user's id, mapping thrown domain errors to a safe Indonesian message. Never lets a raw error escape to the client. */
async function withEditorAuth<T>(fn: (userId: string) => Promise<T>): Promise<ActionResult<T>> {
  const user = await requireAppUser();

  try {
    const data = await fn(user.id);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: mapEditorErrorMessage(error) };
  }
}

function invalidInput(fieldErrors: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error: "Periksa kembali data yang kamu masukkan.", fieldErrors };
}

export async function saveWeddingProfileAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.updateWeddingProfile>>>> {
  const parsed = weddingProfileSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) =>
    editorService.updateWeddingProfile(eventId, userId, parsed.data),
  );
}

export async function saveThemeAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.updateTheme>>>> {
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) => editorService.updateTheme(eventId, userId, parsed.data));
}

export async function selectTemplateAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<{ templateKey: string | null }>> {
  const parsed = templateSelectionSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) =>
    editorService.selectTemplate(eventId, userId, parsed.data.templateSlug),
  );
}

export async function createScheduleAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.createSchedule>>>> {
  const parsed = scheduleFormSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) =>
    editorService.createSchedule(eventId, userId, toScheduleInput(parsed.data)),
  );
}

export async function updateScheduleAction(
  eventId: string,
  scheduleId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.updateSchedule>>>> {
  const parsed = scheduleFormSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) =>
    editorService.updateSchedule(eventId, userId, scheduleId, toScheduleInput(parsed.data)),
  );
}

export async function deleteScheduleAction(
  eventId: string,
  scheduleId: string,
): Promise<ActionResult<null>> {
  return withEditorAuth(async (userId) => {
    await editorService.deleteSchedule(eventId, userId, scheduleId);
    return null;
  });
}

export async function saveLoveStoryTitleAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.updateLoveStoryTitle>>>> {
  const parsed = loveStoryTitleSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) =>
    editorService.updateLoveStoryTitle(eventId, userId, parsed.data.title),
  );
}

export async function addLoveStoryItemAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.addLoveStoryItem>>>> {
  const parsed = loveStoryItemSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) => editorService.addLoveStoryItem(eventId, userId, parsed.data));
}

export async function updateLoveStoryItemAction(
  eventId: string,
  itemId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.updateLoveStoryItem>>>> {
  const parsed = loveStoryItemSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) =>
    editorService.updateLoveStoryItem(eventId, userId, itemId, parsed.data),
  );
}

export async function deleteLoveStoryItemAction(
  eventId: string,
  itemId: string,
): Promise<ActionResult<null>> {
  return withEditorAuth(async (userId) => {
    await editorService.deleteLoveStoryItem(eventId, userId, itemId);
    return null;
  });
}

export async function addGalleryItemAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.addGalleryItem>>>> {
  const parsed = galleryItemSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) => editorService.addGalleryItem(eventId, userId, parsed.data));
}

export async function updateGalleryItemAction(
  eventId: string,
  itemId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.updateGalleryItem>>>> {
  const parsed = galleryItemSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) =>
    editorService.updateGalleryItem(eventId, userId, itemId, parsed.data),
  );
}

export async function deleteGalleryItemAction(
  eventId: string,
  itemId: string,
): Promise<ActionResult<null>> {
  return withEditorAuth(async (userId) => {
    await editorService.deleteGalleryItem(eventId, userId, itemId);
    return null;
  });
}
