import "server-only";
import { EventMemberRole, Prisma, WishStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import {
  EventNotFoundError,
  InvalidWishTokenError,
  WishLimitExceededError,
  WishNotFoundError,
} from "@/lib/wishes/errors";
import { wishTokenSchema } from "@/lib/wishes/validation";
import type { WishFormInput, WishModerationQueryInput } from "@/lib/wishes/validation";
import type { WishListItem, WishModerationData } from "@/lib/wishes/types";

export const WISH_PAGE_SIZE = 25;

/**
 * `Wish` has no per-guest uniqueness constraint (docs/DATABASE.md §17
 * deliberately allows more than one message per guest, unlike RSVP's
 * `eventId_guestId` unique index) — this bounds how many separate,
 * non-deleted wish rows one guest can create for a single event via a
 * plain count check, without a schema change. See docs/DECISIONS.md D-038.
 */
export const WISH_PER_GUEST_LIMIT = 3;

interface WishGuestContext {
  guestId: string;
  guestName: string;
}

/**
 * Resolves a guest strictly from a token, cross-checked against the
 * caller's own `eventId`. Never exported — every caller in this module
 * gets a guest identity this way, never from a client-supplied id. A
 * malformed token, an unknown token, and a token whose guest belongs to a
 * different event all resolve to `null` identically, matching
 * `lib/rsvp/service.ts`'s `resolveGuestForRsvp()`.
 */
async function resolveGuestForWish(
  eventId: string,
  rawToken: unknown,
): Promise<WishGuestContext | null> {
  const parsed = wishTokenSchema.safeParse(rawToken);
  if (!parsed.success) return null;

  const invitation = await prisma.guestInvitation.findUnique({
    where: { token: parsed.data },
    select: {
      guest: { select: { id: true, eventId: true, name: true } },
    },
  });

  if (!invitation?.guest) return null;
  if (invitation.guest.eventId !== eventId) return null;

  return { guestId: invitation.guest.id, guestName: invitation.guest.name };
}

/**
 * Creates a new `PENDING` wish. Never accepts a client-supplied guestId —
 * the guest is always resolved server-side from the token. Throws
 * `InvalidWishTokenError` for anything that doesn't resolve to a real,
 * same-event guest, and `WishLimitExceededError` once that guest has
 * reached `WISH_PER_GUEST_LIMIT` non-deleted wishes for this event.
 */
export async function submitWishForGuest(
  eventId: string,
  rawToken: unknown,
  input: WishFormInput,
): Promise<void> {
  const context = await resolveGuestForWish(eventId, rawToken);
  if (!context) throw new InvalidWishTokenError();

  const existingCount = await prisma.wish.count({
    where: { eventId, guestId: context.guestId, status: { not: WishStatus.DELETED } },
  });
  if (existingCount >= WISH_PER_GUEST_LIMIT) {
    throw new WishLimitExceededError(WISH_PER_GUEST_LIMIT);
  }

  await prisma.wish.create({
    data: {
      eventId,
      guestId: context.guestId,
      name: input.name,
      message: input.message,
      status: WishStatus.PENDING,
    },
  });
}

/**
 * `ALL` means "every non-deleted wish," not literally every row — a
 * deleted wish is only visible by explicitly filtering for `DELETED`.
 * Mirrors `lib/rsvp/service.ts`'s `buildRsvpGuestFilter()` shape.
 */
function buildWishFilter(
  eventId: string,
  status: WishModerationQueryInput["status"],
): Prisma.WishWhereInput {
  if (status === "ALL") return { eventId, status: { not: WishStatus.DELETED } };
  return { eventId, status };
}

/** VIEWER-and-above — read-only for a VIEWER-role member, matching the guest list's/RSVP dashboard's read boundary (D-023). */
export async function getWishesForModeration(
  eventId: string,
  userId: string,
  query: WishModerationQueryInput,
): Promise<WishModerationData> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();

  const role: EventMemberRole =
    event.ownerId === userId
      ? EventMemberRole.OWNER
      : (event.members[0]?.role ?? EventMemberRole.VIEWER);

  const where = buildWishFilter(eventId, query.status);

  const [total, wishes] = await Promise.all([
    prisma.wish.count({ where }),
    prisma.wish.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * WISH_PAGE_SIZE,
      take: WISH_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        message: true,
        status: true,
        createdAt: true,
        guest: { select: { name: true } },
      },
    }),
  ]);

  const items: WishListItem[] = wishes.map((wish) => ({
    id: wish.id,
    guestName: wish.guest.name,
    name: wish.name,
    message: wish.message,
    status: wish.status,
    createdAt: wish.createdAt,
  }));

  return {
    event: { id: event.id, title: event.title },
    role,
    wishes: items,
    total,
    page: query.page,
    pageSize: WISH_PAGE_SIZE,
  };
}

/**
 * Shared by approve/hide/delete below. EDITOR-and-above. Re-verifies
 * `{ id: wishId, eventId }` via `findFirst` before updating — never
 * `wish.update({ where: { id } })` alone, which would let a caller mutate
 * another event's wish merely by knowing its id (same IDOR pattern as
 * `lib/gifts/service.ts`).
 */
async function setWishStatus(
  eventId: string,
  userId: string,
  wishId: string,
  nextStatus: WishStatus,
): Promise<void> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const existing = await prisma.wish.findFirst({
    where: { id: wishId, eventId },
    select: { id: true },
  });
  if (!existing) throw new WishNotFoundError();

  await prisma.wish.update({ where: { id: wishId }, data: { status: nextStatus } });
}

export async function approveWishForUser(
  eventId: string,
  userId: string,
  wishId: string,
): Promise<void> {
  await setWishStatus(eventId, userId, wishId, WishStatus.APPROVED);
}

export async function hideWishForUser(
  eventId: string,
  userId: string,
  wishId: string,
): Promise<void> {
  await setWishStatus(eventId, userId, wishId, WishStatus.HIDDEN);
}

/**
 * A soft delete — sets `status` to `DELETED` rather than removing the row.
 * `WishStatus` already defines `DELETED` as a value distinct from
 * `HIDDEN` (docs/DATABASE.md §17), which only makes sense as a state a row
 * can be *in*; see docs/DECISIONS.md D-038 for the full rationale.
 */
export async function deleteWishForUser(
  eventId: string,
  userId: string,
  wishId: string,
): Promise<void> {
  await setWishStatus(eventId, userId, wishId, WishStatus.DELETED);
}
