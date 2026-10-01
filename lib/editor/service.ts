import "server-only";
import { EventMemberRole, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";
import type { IdentityProfileData } from "@/lib/event-types/identity";
import { IDENTITY_PROFILE_INCLUDE, toIdentityProfileData } from "@/lib/event-types/identity-record";
import {
  findNonToggleableSections,
  getReorderableSectionKeys,
  mergeSectionOrder,
  mergeSectionOverrides,
  parseSectionOrder,
  parseSectionOverrides,
  resolveSectionMoveSwap,
  resolveSectionOrder,
  type InvitationSectionKey,
  type SectionOverrides,
} from "@/lib/event-types/sections";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { resolveOpeningEnabled } from "@/lib/invitations/opening";
import {
  EventNotFoundError,
  IdentityFamilyMismatchError,
  SectionNotToggleableError,
  TemplateNotAvailableError,
} from "@/lib/editor/errors";
import { isKnownTemplateKey } from "@/lib/invitations/templates/registry";
import { GalleryStorageDeletionError } from "@/lib/storage/errors";
import {
  buildCoverPhotoObjectPath,
  buildGalleryObjectPath,
  derivePathFromPublicUrl,
} from "@/lib/storage/paths";
import { getStorageProvider } from "@/lib/storage/provider";
import type { ValidatedGalleryImage } from "@/lib/storage/validation";
import type {
  GalleryVideoItemInput,
  IdentityProfileInput,
  LoveStoryItemInput,
  ScheduleInput,
  ThemeInput,
} from "@/lib/editor/validation";
import type {
  EditorEventData,
  EditorGallery,
  EditorLoveStory,
  EditorSchedule,
  EditorTemplateOption,
} from "@/lib/editor/types";

const EDITOR_EVENT_INCLUDE = {
  template: { select: { slug: true } },
  theme: true,
  ...IDENTITY_PROFILE_INCLUDE,
  schedules: { orderBy: { sortOrder: "asc" as const }, include: { venue: true } },
  loveStories: {
    orderBy: { sortOrder: "asc" as const },
    include: { items: { orderBy: { sortOrder: "asc" as const } } },
  },
  galleries: {
    orderBy: { sortOrder: "asc" as const },
    include: { items: { orderBy: { sortOrder: "asc" as const } } },
  },
} satisfies Prisma.EventInclude;

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeOnly(date: Date): string {
  return date.toISOString().slice(11, 16);
}

function timeOnlyToDate(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function dateOnlyToDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Authorizes at EDITOR level (owner or EventMember EDITOR/OWNER) — a VIEWER cannot open the editor at all in this phase, not even read-only. */
async function requireEditorAccess(eventId: string, userId: string) {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();
  return event;
}

function mapSchedule(schedule: {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  venue: {
    name: string;
    address: string;
    mapUrl: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
}): EditorSchedule {
  return {
    id: schedule.id,
    title: schedule.title,
    description: schedule.description,
    date: toDateOnly(schedule.date),
    startTime: toTimeOnly(schedule.startTime),
    endTime: toTimeOnly(schedule.endTime),
    venue: schedule.venue
      ? {
          name: schedule.venue.name,
          address: schedule.venue.address,
          mapUrl: schedule.venue.mapUrl,
          latitude: schedule.venue.latitude,
          longitude: schedule.venue.longitude,
        }
      : null,
  };
}

/** Loads the full editable view of an event. Throws EventNotFoundError if the event doesn't exist or the user isn't authorized at EDITOR level. */
export async function getEditorEvent(eventId: string, userId: string): Promise<EditorEventData> {
  await requireEditorAccess(eventId, userId);

  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    include: EDITOR_EVENT_INCLUDE,
  });

  const loveStory: EditorLoveStory | null = event.loveStories[0]
    ? {
        id: event.loveStories[0].id,
        title: event.loveStories[0].title,
        items: event.loveStories[0].items.map((item) => ({
          id: item.id,
          dateLabel: item.dateLabel,
          title: item.title,
          description: item.description,
          imageUrl: item.imageUrl,
        })),
      }
    : null;

  const gallery: EditorGallery | null = event.galleries[0]
    ? {
        id: event.galleries[0].id,
        title: event.galleries[0].title,
        items: event.galleries[0].items.map((item) => ({
          id: item.id,
          type: item.type,
          url: item.url,
          thumbnailUrl: item.thumbnailUrl,
          caption: item.caption,
        })),
      }
    : null;

  return {
    eventId: event.id,
    title: event.title,
    slug: event.slug,
    type: event.type,
    status: event.status,
    description: event.description,
    templateKey: event.template?.slug ?? null,
    identity: toIdentityProfileData(event),
    sectionOverrides: parseSectionOverrides(event.settings),
    sectionOrder: parseSectionOrder(event.settings),
    openingEnabled: resolveOpeningEnabled(event.settings),
    theme: event.theme
      ? {
          primaryColor: event.theme.primaryColor,
          secondaryColor: event.theme.secondaryColor,
          backgroundColor: event.theme.backgroundColor,
          textColor: event.theme.textColor,
          accentColor: event.theme.accentColor,
          headingFont: event.theme.headingFont,
          bodyFont: event.theme.bodyFont,
          scriptFont: event.theme.scriptFont,
          backgroundImageUrl: event.theme.backgroundImageUrl,
        }
      : null,
    schedules: event.schedules.map(mapSchedule),
    loveStory,
    gallery,
  };
}

/** Every active Template row, flagged with whether it's actually implemented in the registry — never presents an unimplemented template as a real choice. */
export async function listTemplateOptions(): Promise<EditorTemplateOption[]> {
  const templates = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });

  return templates.map((template) => ({
    slug: template.slug,
    name: template.name,
    implemented: isKnownTemplateKey(template.slug),
  }));
}

const NO_PROFILE_RECORDS = {
  weddingProfile: null,
  personProfile: null,
  babyFamilyProfile: null,
  hostProfile: null,
  organizationProfile: null,
} as const;

/**
 * Upserts the identity profile for the event's own identity family and
 * returns the canonical identity data. The family is checked against the
 * STORED event type, never trusted from the client: a profile for the
 * wrong family (or any profile for OTHER, which has none) is rejected
 * before anything is written. EventType is immutable after creation
 * (lib/events/service.ts), so the checked type can't change underneath.
 */
export async function updateIdentityProfile(
  eventId: string,
  userId: string,
  input: IdentityProfileInput,
): Promise<IdentityProfileData> {
  const event = await requireEditorAccess(eventId, userId);
  const { type } = event;
  if (input.family !== EVENT_TYPE_CONFIG[type].family) throw new IdentityFamilyMismatchError();

  switch (input.family) {
    case "COUPLE": {
      if (type !== "ANNIVERSARY" && input.data.yearsTogether !== null) {
        throw new IdentityFamilyMismatchError();
      }
      const weddingProfile = await prisma.weddingProfile.upsert({
        where: { eventId },
        update: input.data,
        create: { eventId, ...input.data },
      });
      return toIdentityProfileData({ type, ...NO_PROFILE_RECORDS, weddingProfile });
    }
    case "PERSON": {
      const personProfile = await prisma.personProfile.upsert({
        where: { eventId },
        update: input.data,
        create: { eventId, ...input.data },
      });
      return toIdentityProfileData({ type, ...NO_PROFILE_RECORDS, personProfile });
    }
    case "BABY_FAMILY": {
      const data = {
        ...input.data,
        birthDate: input.data.birthDate ? dateOnlyToDate(input.data.birthDate) : null,
      };
      const babyFamilyProfile = await prisma.babyFamilyProfile.upsert({
        where: { eventId },
        update: data,
        create: { eventId, ...data },
      });
      return toIdentityProfileData({ type, ...NO_PROFILE_RECORDS, babyFamilyProfile });
    }
    case "HOST_GROUP": {
      const hostProfile = await prisma.hostProfile.upsert({
        where: { eventId },
        update: input.data,
        create: { eventId, ...input.data },
      });
      return toIdentityProfileData({ type, ...NO_PROFILE_RECORDS, hostProfile });
    }
    case "ORGANIZATION": {
      const organizationProfile = await prisma.organizationProfile.upsert({
        where: { eventId },
        update: input.data,
        create: { eventId, ...input.data },
      });
      return toIdentityProfileData({ type, ...NO_PROFILE_RECORDS, organizationProfile });
    }
  }
}

/**
 * Persists owner section overrides into `Event.settings.sections`, merged
 * with what's already stored. Rejects overrides for sections the type
 * doesn't let the owner toggle (e.g. identity for OTHER) rather than
 * persisting a value that would never apply. Returns the stored overrides.
 */
export async function updateSectionOverrides(
  eventId: string,
  userId: string,
  overrides: SectionOverrides,
): Promise<SectionOverrides> {
  const event = await requireEditorAccess(eventId, userId);
  if (findNonToggleableSections(event.type, overrides).length > 0) {
    throw new SectionNotToggleableError();
  }

  const settings = mergeSectionOverrides(event.settings, overrides);
  await prisma.event.update({
    where: { id: eventId },
    data: { settings: settings as Prisma.InputJsonObject },
  });

  return settings.sections;
}

/**
 * Moves one configurable section up or down by one position and persists
 * the resulting order into `Event.settings.sectionOrder`, merged with
 * what's already stored (docs/PRD.md §15 "Reorder", D-066/D-067). Mirrors
 * `moveGalleryItem()`'s swap-and-persist shape below. Closing can never be
 * passed here: it has no `InvitationSectionKey` value to represent it.
 *
 * Swaps against the nearest *reorderable* (type-supported) neighbor, via
 * `getReorderableSectionKeys(event.type)` — not the literal adjacent array
 * index. A currently-unsupported section (e.g. `identity` for `OTHER`)
 * still occupies a slot in the persisted order, but is invisible in the
 * editor's list and must never act as a reorder barrier or an accidental
 * swap target (D-067-FIX). `key` itself is not re-validated as an error
 * condition — unlike enable/disable, calling this with an unsupported
 * `key` simply no-ops, matching `resolveSectionMoveSwap()`'s "nothing to
 * do" contract, since the editor never offers a move control for a
 * section it doesn't show in the first place.
 *
 * No-ops (returns the current order unchanged) when `key` is already at
 * the relevant edge — the same "nothing to do" contract
 * `resolveGalleryMoveSwap()` already established.
 */
export async function moveSectionOrder(
  eventId: string,
  userId: string,
  key: InvitationSectionKey,
  direction: "up" | "down",
): Promise<InvitationSectionKey[]> {
  const event = await requireEditorAccess(eventId, userId);

  const currentOrder = resolveSectionOrder(event.settings);
  const reorderableKeys = getReorderableSectionKeys(event.type);
  const swap = resolveSectionMoveSwap(currentOrder, key, direction, reorderableKeys);
  if (!swap) return currentOrder;

  const reordered = [...currentOrder];
  [reordered[swap.indexA], reordered[swap.indexB]] = [
    reordered[swap.indexB],
    reordered[swap.indexA],
  ];

  const settings = mergeSectionOrder(event.settings, reordered);
  await prisma.event.update({
    where: { id: eventId },
    data: { settings: settings as Prisma.InputJsonObject },
  });

  return reordered;
}

export async function updateTheme(eventId: string, userId: string, input: ThemeInput) {
  await requireEditorAccess(eventId, userId);

  return prisma.theme.upsert({
    where: { eventId },
    update: input,
    create: { eventId, ...input },
  });
}

/**
 * Uploads a new cover/background photo for the event's Theme and returns
 * its public URL. Deliberately does not itself write
 * `Theme.backgroundImageUrl` — the caller (`ThemeForm`'s existing
 * autosave, via `updateTheme`) persists it exactly like every other theme
 * field, keeping a single write path for `Theme` data instead of two.
 *
 * `previousUrl` (the value being replaced, if any) is best-effort cleaned
 * up from storage *after* the new upload succeeds. Unlike
 * `deleteGalleryItem`'s storage-first/fail-closed ordering (there,
 * removal is the entire point of the call), a failed cleanup here must
 * never cost the caller the photo they just successfully uploaded, so it
 * is logged and swallowed instead of thrown.
 */
export async function uploadCoverPhoto(
  eventId: string,
  userId: string,
  validated: ValidatedGalleryImage,
  previousUrl: string | null,
): Promise<{ publicUrl: string }> {
  await requireEditorAccess(eventId, userId);

  const path = buildCoverPhotoObjectPath(eventId, validated.extension);
  const { publicUrl } = await getStorageProvider().upload(
    path,
    validated.buffer,
    validated.contentType,
  );

  const previousPath = previousUrl ? derivePathFromPublicUrl(previousUrl) : null;
  if (previousPath) {
    try {
      await getStorageProvider().remove(previousPath);
    } catch (error) {
      console.error("[theme] Failed to remove previous cover photo object", error);
    }
  }

  return { publicUrl };
}

/**
 * Removes the event's current cover photo object from storage
 * (best-effort — see `uploadCoverPhoto`'s doc comment). The caller still
 * persists `backgroundImageUrl: null` itself via the normal `updateTheme`
 * autosave path.
 */
export async function removeCoverPhoto(
  eventId: string,
  userId: string,
  currentUrl: string,
): Promise<void> {
  await requireEditorAccess(eventId, userId);

  const path = derivePathFromPublicUrl(currentUrl);
  if (!path) return;

  try {
    await getStorageProvider().remove(path);
  } catch (error) {
    console.error("[theme] Failed to remove cover photo object", error);
  }
}

export async function selectTemplate(eventId: string, userId: string, templateSlug: string | null) {
  await requireEditorAccess(eventId, userId);

  if (templateSlug === null) {
    await prisma.event.update({ where: { id: eventId }, data: { templateId: null } });
    return { templateKey: null };
  }

  const template = await prisma.template.findUnique({ where: { slug: templateSlug } });
  if (!template || !template.isActive || !isKnownTemplateKey(template.slug)) {
    throw new TemplateNotAvailableError();
  }

  await prisma.event.update({ where: { id: eventId }, data: { templateId: template.id } });
  return { templateKey: template.slug };
}

// ---------------------------------------------------------------------------
// Schedule (+ embedded venue)
// ---------------------------------------------------------------------------

export async function createSchedule(
  eventId: string,
  userId: string,
  input: ScheduleInput,
): Promise<EditorSchedule> {
  await requireEditorAccess(eventId, userId);

  const created = await prisma.$transaction(async (tx) => {
    let venueId: string | null = null;
    if (input.venue) {
      const venue = await tx.venue.create({ data: { eventId, ...input.venue } });
      venueId = venue.id;
    }

    return tx.eventSchedule.create({
      data: {
        eventId,
        title: input.title,
        description: input.description,
        date: dateOnlyToDate(input.date),
        startTime: timeOnlyToDate(input.startTime),
        endTime: timeOnlyToDate(input.endTime),
        venueId,
      },
      include: { venue: true },
    });
  });

  return mapSchedule(created);
}

export async function updateSchedule(
  eventId: string,
  userId: string,
  scheduleId: string,
  input: ScheduleInput,
): Promise<EditorSchedule> {
  await requireEditorAccess(eventId, userId);

  // Scoped to eventId: without this, a scheduleId belonging to a DIFFERENT
  // event the caller doesn't own could be mutated just by knowing its id.
  const existing = await prisma.eventSchedule.findFirst({ where: { id: scheduleId, eventId } });
  if (!existing) throw new EventNotFoundError();

  const updated = await prisma.$transaction(async (tx) => {
    let venueId: string | null = null;

    if (input.venue) {
      if (existing.venueId) {
        await tx.venue.update({ where: { id: existing.venueId }, data: input.venue });
        venueId = existing.venueId;
      } else {
        const venue = await tx.venue.create({ data: { eventId, ...input.venue } });
        venueId = venue.id;
      }
    }
    // else: venue removed by the user — leave any existing Venue row
    // in place (not deleted) and detach it, per the "don't delete nested
    // records the UI merely omitted" rule.

    return tx.eventSchedule.update({
      where: { id: scheduleId },
      data: {
        title: input.title,
        description: input.description,
        date: dateOnlyToDate(input.date),
        startTime: timeOnlyToDate(input.startTime),
        endTime: timeOnlyToDate(input.endTime),
        venueId,
      },
      include: { venue: true },
    });
  });

  return mapSchedule(updated);
}

export async function deleteSchedule(
  eventId: string,
  userId: string,
  scheduleId: string,
): Promise<void> {
  await requireEditorAccess(eventId, userId);

  const existing = await prisma.eventSchedule.findFirst({ where: { id: scheduleId, eventId } });
  if (!existing) throw new EventNotFoundError();

  await prisma.eventSchedule.delete({ where: { id: scheduleId } });
}

// ---------------------------------------------------------------------------
// Love story
// ---------------------------------------------------------------------------

async function getOrCreateLoveStory(eventId: string) {
  const existing = await prisma.loveStory.findFirst({ where: { eventId } });
  if (existing) return existing;
  return prisma.loveStory.create({ data: { eventId } });
}

export async function updateLoveStoryTitle(
  eventId: string,
  userId: string,
  title: string | null,
): Promise<EditorLoveStory> {
  await requireEditorAccess(eventId, userId);

  const story = await getOrCreateLoveStory(eventId);
  const updated = await prisma.loveStory.update({
    where: { id: story.id },
    data: { title },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return {
    id: updated.id,
    title: updated.title,
    items: updated.items.map((item) => ({
      id: item.id,
      dateLabel: item.dateLabel,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
    })),
  };
}

export async function addLoveStoryItem(eventId: string, userId: string, input: LoveStoryItemInput) {
  await requireEditorAccess(eventId, userId);

  const story = await getOrCreateLoveStory(eventId);
  const count = await prisma.loveStoryItem.count({ where: { loveStoryId: story.id } });

  return prisma.loveStoryItem.create({
    data: { loveStoryId: story.id, ...input, sortOrder: count },
  });
}

export async function updateLoveStoryItem(
  eventId: string,
  userId: string,
  itemId: string,
  input: LoveStoryItemInput,
) {
  await requireEditorAccess(eventId, userId);

  // Scoped through the loveStory relation to eventId — same IDOR reasoning
  // as updateSchedule.
  const existing = await prisma.loveStoryItem.findFirst({
    where: { id: itemId, loveStory: { eventId } },
  });
  if (!existing) throw new EventNotFoundError();

  return prisma.loveStoryItem.update({ where: { id: itemId }, data: input });
}

export async function deleteLoveStoryItem(
  eventId: string,
  userId: string,
  itemId: string,
): Promise<void> {
  await requireEditorAccess(eventId, userId);

  const existing = await prisma.loveStoryItem.findFirst({
    where: { id: itemId, loveStory: { eventId } },
  });
  if (!existing) throw new EventNotFoundError();

  await prisma.loveStoryItem.delete({ where: { id: itemId } });
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

async function getOrCreateGallery(eventId: string) {
  const existing = await prisma.gallery.findFirst({ where: { eventId } });
  if (existing) return existing;
  return prisma.gallery.create({ data: { eventId } });
}

/** Video items only as of Phase 11 — see GalleryVideoItemInput's doc comment. */
export async function addGalleryItem(
  eventId: string,
  userId: string,
  input: GalleryVideoItemInput,
) {
  await requireEditorAccess(eventId, userId);

  const gallery = await getOrCreateGallery(eventId);
  const count = await prisma.galleryItem.count({ where: { galleryId: gallery.id } });

  return prisma.galleryItem.create({
    data: { galleryId: gallery.id, ...input, sortOrder: count },
  });
}

/** Video items only — editing an image's file is delete + re-upload, not an in-place URL edit. */
export async function updateGalleryItem(
  eventId: string,
  userId: string,
  itemId: string,
  input: GalleryVideoItemInput,
) {
  await requireEditorAccess(eventId, userId);

  const existing = await prisma.galleryItem.findFirst({
    where: { id: itemId, gallery: { eventId } },
  });
  if (!existing) throw new EventNotFoundError();

  return prisma.galleryItem.update({ where: { id: itemId }, data: input });
}

/** Caption-only edit, valid for both IMAGE and VIDEO items. */
export async function updateGalleryItemCaption(
  eventId: string,
  userId: string,
  itemId: string,
  caption: string | null,
) {
  await requireEditorAccess(eventId, userId);

  const existing = await prisma.galleryItem.findFirst({
    where: { id: itemId, gallery: { eventId } },
  });
  if (!existing) throw new EventNotFoundError();

  return prisma.galleryItem.update({ where: { id: itemId }, data: { caption } });
}

/**
 * Uploads a real image file to object storage and creates its
 * `GalleryItem` row. `validated` must already have passed
 * `lib/storage/validation.ts`'s `validateGalleryImageUpload()` — this
 * function does not re-validate file content, only authorization and
 * persistence.
 */
export async function uploadGalleryImage(
  eventId: string,
  userId: string,
  validated: ValidatedGalleryImage,
  caption: string | null,
) {
  await requireEditorAccess(eventId, userId);

  const gallery = await getOrCreateGallery(eventId);
  const count = await prisma.galleryItem.count({ where: { galleryId: gallery.id } });

  const path = buildGalleryObjectPath(eventId, validated.extension);
  const { publicUrl } = await getStorageProvider().upload(
    path,
    validated.buffer,
    validated.contentType,
  );

  return prisma.galleryItem.create({
    data: {
      galleryId: gallery.id,
      type: "IMAGE",
      url: publicUrl,
      thumbnailUrl: null,
      caption,
      sortOrder: count,
    },
  });
}

/**
 * Deletes a gallery item. Storage-first, non-atomic, fail-closed — see
 * docs/DECISIONS.md D-040: the underlying object (when this item's `url`
 * resolves to one of our own storage objects — see
 * `derivePathFromPublicUrl`'s doc comment for why a legacy/external URL
 * safely no-ops here) is removed *before* the DB row, and a storage
 * failure aborts the whole operation (the DB row is left in place) rather
 * than deleting the row and silently orphaning the object. A Prisma
 * transaction cannot span an external Storage API call, so this ordering
 * is the compensation strategy instead.
 */
export async function deleteGalleryItem(
  eventId: string,
  userId: string,
  itemId: string,
): Promise<void> {
  await requireEditorAccess(eventId, userId);

  const existing = await prisma.galleryItem.findFirst({
    where: { id: itemId, gallery: { eventId } },
  });
  if (!existing) throw new EventNotFoundError();

  const objectPath = derivePathFromPublicUrl(existing.url);
  if (objectPath) {
    try {
      await getStorageProvider().remove(objectPath);
    } catch (error) {
      console.error("[gallery] Failed to remove storage object; delete aborted", error);
      throw new GalleryStorageDeletionError();
    }
  }

  await prisma.galleryItem.delete({ where: { id: itemId } });
}

/**
 * Pure — swaps the target item with its immediate neighbor in display
 * order. Returns `null` when the item isn't found or is already at the
 * relevant edge (nothing to do), so the caller can no-op cleanly instead
 * of persisting a pointless identical order.
 */
export function resolveGalleryMoveSwap(
  itemIdsInOrder: string[],
  itemId: string,
  direction: "up" | "down",
): { indexA: number; indexB: number } | null {
  const index = itemIdsInOrder.indexOf(itemId);
  if (index === -1) return null;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= itemIdsInOrder.length) return null;

  return { indexA: index, indexB: targetIndex };
}

/**
 * Persists a one-step reorder (move up/down by one position) by swapping
 * the two affected items' `sortOrder` values in a transaction. Returns
 * the gallery's items in their new order so the caller can update local
 * state directly from the server's own result rather than optimistically
 * guessing it.
 */
export async function moveGalleryItem(
  eventId: string,
  userId: string,
  itemId: string,
  direction: "up" | "down",
) {
  await requireEditorAccess(eventId, userId);

  const gallery = await prisma.gallery.findFirst({
    where: { eventId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!gallery) throw new EventNotFoundError();

  const itemIds = gallery.items.map((item) => item.id);
  const swap = resolveGalleryMoveSwap(itemIds, itemId, direction);
  if (!swap) {
    // Not found at all is a real IDOR/not-found case; already-at-the-edge
    // is a legitimate no-op — both return the current order unchanged.
    if (!itemIds.includes(itemId)) throw new EventNotFoundError();
    return gallery.items;
  }

  const itemA = gallery.items[swap.indexA];
  const itemB = gallery.items[swap.indexB];

  await prisma.$transaction([
    prisma.galleryItem.update({ where: { id: itemA.id }, data: { sortOrder: itemB.sortOrder } }),
    prisma.galleryItem.update({ where: { id: itemB.id }, data: { sortOrder: itemA.sortOrder } }),
  ]);

  const reordered = [...gallery.items];
  [reordered[swap.indexA], reordered[swap.indexB]] = [
    reordered[swap.indexB],
    reordered[swap.indexA],
  ];
  return reordered;
}
