import "server-only";
import { EventMemberRole, GiftMethodType, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { EventNotFoundError, GiftMethodNotFoundError } from "@/lib/gifts/errors";
import type { GiftMethodInput } from "@/lib/gifts/validation";
import type { GiftMethodListItem } from "@/lib/gifts/types";

const GIFT_METHOD_SELECT = {
  id: true,
  type: true,
  providerName: true,
  accountName: true,
  accountNumber: true,
  qrImageUrl: true,
  instructions: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.GiftMethodSelect;

type GiftMethodRow = Prisma.GiftMethodGetPayload<{ select: typeof GIFT_METHOD_SELECT }>;

function toListItem(giftMethod: GiftMethodRow): GiftMethodListItem {
  return { ...giftMethod };
}

/**
 * `GiftMethod` has one fixed column set shared by every `type`
 * (docs/DATABASE.md §18, docs/DECISIONS.md D-034) — a form can leave a
 * stray value in a column that doesn't apply to the currently selected
 * type (e.g. a leftover `qrImageUrl` after switching a method from QR to
 * BANK). This nulls out whatever the selected type doesn't use, so a
 * gift method's stored data always matches what its own type actually
 * displays. Pure and unit-tested in isolation.
 */
export function sanitizeGiftMethodInput(input: GiftMethodInput): GiftMethodInput {
  switch (input.type) {
    case GiftMethodType.BANK:
    case GiftMethodType.EWALLET:
      return { ...input, qrImageUrl: null };
    case GiftMethodType.QR:
      return { ...input, accountName: null, accountNumber: null };
    case GiftMethodType.OTHER:
      return { ...input, qrImageUrl: null };
    default:
      return input;
  }
}

/** VIEWER-and-above — read-only for a VIEWER-role member, matching the guest list's read boundary (D-023). */
export async function getGiftMethodsForUser(
  eventId: string,
  userId: string,
): Promise<{
  event: { id: string; title: string };
  role: EventMemberRole;
  giftMethods: GiftMethodListItem[];
}> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.VIEWER);
  if (!event) throw new EventNotFoundError();

  const role: EventMemberRole =
    event.ownerId === userId
      ? EventMemberRole.OWNER
      : (event.members[0]?.role ?? EventMemberRole.VIEWER);

  const giftMethods = await prisma.giftMethod.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    select: GIFT_METHOD_SELECT,
  });

  return {
    event: { id: event.id, title: event.title },
    role,
    giftMethods: giftMethods.map(toListItem),
  };
}

/** EDITOR-and-above — used to prefill the edit form. Re-verifies `{ id, eventId }` (IDOR-safe). */
export async function getGiftMethodForEditor(
  eventId: string,
  userId: string,
  giftMethodId: string,
): Promise<GiftMethodListItem> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const giftMethod = await prisma.giftMethod.findFirst({
    where: { id: giftMethodId, eventId },
    select: GIFT_METHOD_SELECT,
  });
  if (!giftMethod) throw new GiftMethodNotFoundError();

  return toListItem(giftMethod);
}

export async function createGiftMethodForUser(
  eventId: string,
  userId: string,
  input: GiftMethodInput,
): Promise<GiftMethodListItem> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const data = sanitizeGiftMethodInput(input);
  const giftMethod = await prisma.giftMethod.create({
    data: { eventId, ...data },
    select: GIFT_METHOD_SELECT,
  });

  return toListItem(giftMethod);
}

/** Re-verifies `{ id: giftMethodId, eventId }` before updating — never `giftMethod.update({ where: { id } })` alone, which would let a caller mutate another event's gift method merely by knowing its id. */
export async function updateGiftMethodForUser(
  eventId: string,
  userId: string,
  giftMethodId: string,
  input: GiftMethodInput,
): Promise<GiftMethodListItem> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const existing = await prisma.giftMethod.findFirst({
    where: { id: giftMethodId, eventId },
    select: { id: true },
  });
  if (!existing) throw new GiftMethodNotFoundError();

  const data = sanitizeGiftMethodInput(input);
  const giftMethod = await prisma.giftMethod.update({
    where: { id: giftMethodId },
    data,
    select: GIFT_METHOD_SELECT,
  });

  return toListItem(giftMethod);
}

export async function deleteGiftMethodForUser(
  eventId: string,
  userId: string,
  giftMethodId: string,
): Promise<void> {
  const event = await getAuthorizedEvent(eventId, userId, EventMemberRole.EDITOR);
  if (!event) throw new EventNotFoundError();

  const existing = await prisma.giftMethod.findFirst({
    where: { id: giftMethodId, eventId },
    select: { id: true },
  });
  if (!existing) throw new GiftMethodNotFoundError();

  await prisma.giftMethod.delete({ where: { id: giftMethodId } });
}
