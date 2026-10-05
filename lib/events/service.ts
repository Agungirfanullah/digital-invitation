import "server-only";
import { EventMemberRole, EventStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getMissingPublishRequirements } from "@/lib/event-types/identity";
import { IDENTITY_PROFILE_INCLUDE, toIdentityProfileData } from "@/lib/event-types/identity-record";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import {
  EventDeleteBlockedError,
  EventNotFoundError,
  EventTypeImmutableError,
  PublishRequirementsNotMetError,
  SlugConflictError,
} from "@/lib/events/errors";
import type { CreateEventInput, UpdateEventInput } from "@/lib/events/validation";
import { normalizeConfirmedSeats } from "@/lib/rsvp/service";

const EVENT_SUMMARY_SELECT = {
  id: true,
  title: true,
  slug: true,
  type: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EventSelect;

function isUniqueConstraintError(error: unknown, target: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (Array.isArray(error.meta?.target)
      ? (error.meta.target as string[]).includes(target)
      : error.meta?.target === target)
  );
}

function isForeignKeyRestrictError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2003" || error.code === "P2014")
  );
}

/** Events the user owns or is a member of, newest first. Summary fields only — list views don't need the full record. */
export async function listEventsForUser(userId: string) {
  return prisma.event.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    orderBy: { createdAt: "desc" },
    select: EVENT_SUMMARY_SELECT,
  });
}

export interface EventStats {
  guests: number;
  /** People confirmed as attending (sum of `attendeeCount` over ATTENDING RSVPs), not RSVP rows. */
  attendingPeople: number;
  /** Wishes still visible to the owner: pending or approved (hidden/deleted ones are excluded). */
  wishes: number;
}

/** Only ever called with ids the caller was already authorized for — it does no authorization itself. */
async function loadEventStats(eventIds: string[]): Promise<Map<string, EventStats>> {
  const stats = new Map<string, EventStats>(
    eventIds.map((id) => [id, { guests: 0, attendingPeople: 0, wishes: 0 }]),
  );
  if (eventIds.length === 0) return stats;

  const [guestGroups, attendingGroups, wishGroups] = await Promise.all([
    prisma.guest.groupBy({
      by: ["eventId"],
      where: { eventId: { in: eventIds } },
      _count: { _all: true },
    }),
    prisma.rSVP.groupBy({
      by: ["eventId"],
      where: { eventId: { in: eventIds }, attendance: "ATTENDING" },
      _sum: { attendeeCount: true },
    }),
    prisma.wish.groupBy({
      by: ["eventId"],
      where: { eventId: { in: eventIds }, status: { in: ["PENDING", "APPROVED"] } },
      _count: { _all: true },
    }),
  ]);

  for (const group of guestGroups) {
    const entry = stats.get(group.eventId);
    if (entry) entry.guests = group._count._all;
  }
  for (const group of attendingGroups) {
    const entry = stats.get(group.eventId);
    if (entry) entry.attendingPeople = normalizeConfirmedSeats(group._sum.attendeeCount);
  }
  for (const group of wishGroups) {
    const entry = stats.get(group.eventId);
    if (entry) entry.wishes = group._count._all;
  }
  return stats;
}

/** Same events as `listEventsForUser`, each with real guest/attending/wish counts (three grouped queries total, not one per event). */
export async function listEventsWithStatsForUser(userId: string) {
  const events = await listEventsForUser(userId);
  const stats = await loadEventStats(events.map((event) => event.id));
  return events.map((event) => ({
    ...event,
    stats: stats.get(event.id) ?? { guests: 0, attendingPeople: 0, wishes: 0 },
  }));
}

/** Throws `EventNotFoundError` if the event doesn't exist or the user isn't authorized to view it. */
export async function getEventStatsForUser(eventId: string, userId: string): Promise<EventStats> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();
  const stats = await loadEventStats([event.id]);
  return stats.get(event.id) ?? { guests: 0, attendingPeople: 0, wishes: 0 };
}

/** Throws `EventNotFoundError` if the event doesn't exist or the user isn't authorized to view it. */
export async function getEventForUser(eventId: string, userId: string) {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();
  return event;
}

/** Creates an event owned by `userId`. The owner can never be supplied by the caller/client. */
export async function createEventForUser(userId: string, input: CreateEventInput) {
  try {
    return await prisma.event.create({
      data: {
        ownerId: userId,
        title: input.title,
        type: input.type,
        slug: input.slug,
        description: input.description ?? null,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error, "slug")) throw new SlugConflictError();
    throw error;
  }
}

/**
 * Throws `EventNotFoundError` if not authorized at EDITOR level or above,
 * `SlugConflictError` on a slug collision, and `EventTypeImmutableError` if
 * `input.type` differs from the stored type. `type` is never written here —
 * EventType is immutable after creation (D-063).
 */
export async function updateEventForUser(eventId: string, userId: string, input: UpdateEventInput) {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();
  if (input.type !== undefined && input.type !== event.type) throw new EventTypeImmutableError();

  try {
    return await prisma.event.update({
      where: { id: eventId },
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description ?? null,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error, "slug")) throw new SlugConflictError();
    throw error;
  }
}

/**
 * The type-specific information still missing before `eventId` can be
 * published — see `getMissingPublishRequirements()` (F4-09 agenda-count
 * and venue rule).
 */
async function findMissingPublishRequirements(eventId: string): Promise<string[]> {
  const record = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { ...IDENTITY_PROFILE_INCLUDE, schedules: { select: { venueId: true } } },
  });
  return getMissingPublishRequirements(
    record.type,
    toIdentityProfileData(record),
    record.schedules.length,
    record.schedules.filter((schedule) => schedule.venueId !== null).length,
  );
}

/** VIEWER-and-above — what the event detail page shows before the owner publishes. */
export async function getPublishReadinessForUser(eventId: string, userId: string) {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();
  return { missing: await findMissingPublishRequirements(eventId) };
}

/**
 * Throws `EventNotFoundError` if not authorized at EDITOR level or above,
 * and `PublishRequirementsNotMetError` if the event type's required
 * identity/date information is missing (docs/PRD.md §13–§13.7). Sets
 * `publishedAt` on every publish (acts as "last published at").
 */
export async function publishEventForUser(eventId: string, userId: string) {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const missing = await findMissingPublishRequirements(eventId);
  if (missing.length > 0) throw new PublishRequirementsNotMetError(missing);

  return prisma.event.update({
    where: { id: eventId },
    data: { status: EventStatus.PUBLISHED, publishedAt: new Date() },
  });
}

/**
 * Throws `EventNotFoundError` if not authorized at EDITOR level or above.
 * `publishedAt` is intentionally left as-is (a historical "last published
 * at" record) rather than cleared on unpublish.
 */
export async function unpublishEventForUser(eventId: string, userId: string) {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  return prisma.event.update({
    where: { id: eventId },
    data: { status: EventStatus.DRAFT },
  });
}

/**
 * Deletion is restricted to the event's owner (not just any EDITOR
 * member) — it's the most destructive operation in this domain.
 * Throws `EventNotFoundError` if not owned by `userId`, or
 * `EventDeleteBlockedError` if a restrict-on-delete relation (e.g.
 * recorded gift transactions, once that feature exists) still references
 * it.
 */
export async function deleteEventForUser(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { ownerId: true },
  });

  if (!event || event.ownerId !== userId) throw new EventNotFoundError();

  try {
    await prisma.event.delete({ where: { id: eventId } });
  } catch (error) {
    if (isForeignKeyRestrictError(error)) throw new EventDeleteBlockedError();
    throw error;
  }
}
