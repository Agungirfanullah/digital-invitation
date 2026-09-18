import "server-only";
import { EventMemberRole, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import {
  EventDeleteBlockedError,
  EventNotFoundError,
  SlugConflictError,
} from "@/lib/events/errors";
import type { CreateEventInput, UpdateEventInput } from "@/lib/events/validation";

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

/** Throws `EventNotFoundError` if not authorized at EDITOR level or above, `SlugConflictError` on a slug collision. */
export async function updateEventForUser(eventId: string, userId: string, input: UpdateEventInput) {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  try {
    return await prisma.event.update({
      where: { id: eventId },
      data: {
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
