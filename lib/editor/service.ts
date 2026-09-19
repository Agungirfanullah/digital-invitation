import "server-only";
import { EventMemberRole, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { EventNotFoundError, TemplateNotAvailableError } from "@/lib/editor/errors";
import { isKnownTemplateKey } from "@/lib/invitations/templates/registry";
import type {
  GalleryItemInput,
  LoveStoryItemInput,
  ScheduleInput,
  ThemeInput,
  WeddingProfileInput,
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
  weddingProfile: true,
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
    weddingProfile: event.weddingProfile
      ? {
          brideFullName: event.weddingProfile.brideFullName,
          brideNickname: event.weddingProfile.brideNickname,
          brideFather: event.weddingProfile.brideFather,
          brideMother: event.weddingProfile.brideMother,
          brideInstagram: event.weddingProfile.brideInstagram,
          groomFullName: event.weddingProfile.groomFullName,
          groomNickname: event.weddingProfile.groomNickname,
          groomFather: event.weddingProfile.groomFather,
          groomMother: event.weddingProfile.groomMother,
          groomInstagram: event.weddingProfile.groomInstagram,
        }
      : null,
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

export async function updateWeddingProfile(
  eventId: string,
  userId: string,
  input: WeddingProfileInput,
) {
  await requireEditorAccess(eventId, userId);

  const profile = await prisma.weddingProfile.upsert({
    where: { eventId },
    update: input,
    create: { eventId, ...input },
  });

  return profile;
}

export async function updateTheme(eventId: string, userId: string, input: ThemeInput) {
  await requireEditorAccess(eventId, userId);

  return prisma.theme.upsert({
    where: { eventId },
    update: input,
    create: { eventId, ...input },
  });
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

export async function addGalleryItem(eventId: string, userId: string, input: GalleryItemInput) {
  await requireEditorAccess(eventId, userId);

  const gallery = await getOrCreateGallery(eventId);
  const count = await prisma.galleryItem.count({ where: { galleryId: gallery.id } });

  return prisma.galleryItem.create({
    data: { galleryId: gallery.id, ...input, sortOrder: count },
  });
}

export async function updateGalleryItem(
  eventId: string,
  userId: string,
  itemId: string,
  input: GalleryItemInput,
) {
  await requireEditorAccess(eventId, userId);

  const existing = await prisma.galleryItem.findFirst({
    where: { id: itemId, gallery: { eventId } },
  });
  if (!existing) throw new EventNotFoundError();

  return prisma.galleryItem.update({ where: { id: itemId }, data: input });
}

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

  await prisma.galleryItem.delete({ where: { id: itemId } });
}
