"use server";

import { requireAppUser } from "@/lib/auth/session";
import { mapEditorErrorMessage } from "@/lib/editor/errors";
import { checkGalleryUploadRateLimit } from "@/lib/editor/gallery-rate-limit";
import * as editorService from "@/lib/editor/service";
import {
  galleryCaptionSchema,
  galleryVideoItemSchema,
  loveStoryItemSchema,
  loveStoryTitleSchema,
  scheduleFormSchema,
  templateSelectionSchema,
  themeSchema,
  toScheduleInput,
  weddingProfileSchema,
} from "@/lib/editor/validation";
import { GALLERY_UPLOAD_RATE_LIMIT_MESSAGE, mapStorageErrorMessage } from "@/lib/storage/errors";
import { validateGalleryImageUpload } from "@/lib/storage/validation";
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

/** Adds a VIDEO gallery item by URL — image items are created via uploadGalleryImageAction instead. */
export async function addGalleryItemAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.addGalleryItem>>>> {
  const parsed = galleryVideoItemSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) => editorService.addGalleryItem(eventId, userId, parsed.data));
}

/** Updates a VIDEO gallery item's URL/caption together — image items use updateGalleryItemCaptionAction instead. */
export async function updateGalleryItemAction(
  eventId: string,
  itemId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.updateGalleryItem>>>> {
  const parsed = galleryVideoItemSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) =>
    editorService.updateGalleryItem(eventId, userId, itemId, parsed.data),
  );
}

/** Caption-only edit, valid for both IMAGE and VIDEO gallery items. */
export async function updateGalleryItemCaptionAction(
  eventId: string,
  itemId: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.updateGalleryItemCaption>>>> {
  const parsed = galleryCaptionSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.flatten().fieldErrors);

  return withEditorAuth((userId) =>
    editorService.updateGalleryItemCaption(eventId, userId, itemId, parsed.data.caption),
  );
}

/**
 * Real file upload — a public, unauthenticated-looking Server Action
 * signature (it takes `FormData`, like the RSVP/wish/gift forms
 * elsewhere), but it is not public: `requireAppUser()` runs first, same
 * as every other editor action. FormData (not a plain object) is used
 * here specifically because a `File` can't be represented as the
 * `unknown` JS-object input every other editor action accepts.
 */
export async function uploadGalleryImageAction(
  eventId: string,
  formData: FormData,
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.uploadGalleryImage>>>> {
  const user = await requireAppUser();

  if (!(await checkGalleryUploadRateLimit(user.id))) {
    return { ok: false, error: GALLERY_UPLOAD_RATE_LIMIT_MESSAGE };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      error: "Pilih berkas gambar untuk diunggah.",
      fieldErrors: { file: ["Pilih berkas gambar untuk diunggah."] },
    };
  }

  const parsedCaption = galleryCaptionSchema.safeParse({
    caption: formData.get("caption") || null,
  });
  if (!parsedCaption.success) return invalidInput(parsedCaption.error.flatten().fieldErrors);

  let validated;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    validated = validateGalleryImageUpload({
      name: file.name,
      type: file.type,
      size: file.size,
      buffer,
    });
  } catch (error) {
    const message = mapStorageErrorMessage(error);
    return { ok: false, error: message, fieldErrors: { file: [message] } };
  }

  try {
    const data = await editorService.uploadGalleryImage(
      eventId,
      user.id,
      validated,
      parsedCaption.data.caption,
    );
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: mapEditorErrorMessage(error) };
  }
}

export async function moveGalleryItemAction(
  eventId: string,
  itemId: string,
  direction: "up" | "down",
): Promise<ActionResult<Awaited<ReturnType<typeof editorService.moveGalleryItem>>>> {
  return withEditorAuth((userId) =>
    editorService.moveGalleryItem(eventId, userId, itemId, direction),
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
