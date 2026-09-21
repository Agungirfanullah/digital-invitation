/**
 * Integration tests for the wishes domain/service layer, run against the
 * real Supabase DEV Postgres database via Prisma (no mocks) — same
 * rationale as lib/rsvp/ and lib/gifts/: token resolution, cross-event
 * IDOR defense, the per-guest submission cap, and moderation authorization
 * all need to be proven against real queries, not a mocked Prisma client.
 *
 * Every row created here is deleted in `afterEach` via cascading deletes
 * off the tracked Event/User ids, regardless of test outcome.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { EventMemberRole, WishStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  EventNotFoundError,
  InvalidWishTokenError,
  WishLimitExceededError,
  WishNotFoundError,
} from "@/lib/wishes/errors";
import {
  WISH_PER_GUEST_LIMIT,
  approveWishForUser,
  deleteWishForUser,
  getWishesForModeration,
  hideWishForUser,
  submitWishForGuest,
} from "@/lib/wishes/service";
import type { WishFormInput } from "@/lib/wishes/validation";

const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

afterEach(async () => {
  if (createdEventIds.length) {
    await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
    createdEventIds.length = 0;
  }
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

async function createTestUser(label: string) {
  const user = await prisma.user.create({
    data: {
      id: `test-wishes-${label}-${randomUUID()}`,
      email: `test-wishes-${label}-${randomUUID()}@example.invalid`,
      name: `Test User ${label}`,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createTestEvent(ownerId: string) {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Ucapan Uji Coba",
      slug: `test-wishes-slug-${randomUUID()}`,
      status: "DRAFT",
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function addMember(eventId: string, userId: string, role: EventMemberRole) {
  await prisma.eventMember.create({ data: { eventId, userId, role } });
}

async function createTestGuest(eventId: string, name = "Ayu Lestari") {
  const guest = await prisma.guest.create({
    data: { eventId, name, normalizedName: name.toLowerCase(), seatQuota: 2 },
  });
  const invitation = await prisma.guestInvitation.create({
    data: { eventId, guestId: guest.id, token: randomUUID().replace(/-/g, "") },
  });
  return { guest, invitation };
}

const validWish: WishFormInput = { name: "Ayu Lestari", message: "Selamat menempuh hidup baru!" };

describe("submitWishForGuest (integration — live Supabase DEV database)", () => {
  it("creates a PENDING wish for a valid, same-event token", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest, invitation } = await createTestGuest(event.id);

    await submitWishForGuest(event.id, invitation.token, validWish);

    const stored = await prisma.wish.findMany({ where: { eventId: event.id, guestId: guest.id } });
    expect(stored).toHaveLength(1);
    expect(stored[0].status).toBe(WishStatus.PENDING);
    expect(stored[0].name).toBe("Ayu Lestari");
    expect(stored[0].message).toBe("Selamat menempuh hidup baru!");
  });

  it("rejects a malformed token without creating a wish", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    await expect(submitWishForGuest(event.id, "short", validWish)).rejects.toThrow(
      InvalidWishTokenError,
    );
    expect(await prisma.wish.count({ where: { eventId: event.id } })).toBe(0);
  });

  it("rejects an unknown token", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    await expect(
      submitWishForGuest(event.id, randomUUID().replace(/-/g, ""), validWish),
    ).rejects.toThrow(InvalidWishTokenError);
  });

  it("rejects a token whose guest belongs to a different event (cross-event IDOR)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(eventB.id);

    await expect(submitWishForGuest(eventA.id, invitation.token, validWish)).rejects.toThrow(
      InvalidWishTokenError,
    );
    expect(await prisma.wish.count({ where: { eventId: eventA.id } })).toBe(0);
  });

  it(`rejects a submission once the guest has reached the ${WISH_PER_GUEST_LIMIT}-wish cap`, async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(event.id);

    for (let i = 0; i < WISH_PER_GUEST_LIMIT; i++) {
      await submitWishForGuest(event.id, invitation.token, validWish);
    }

    await expect(submitWishForGuest(event.id, invitation.token, validWish)).rejects.toThrow(
      WishLimitExceededError,
    );
    expect(await prisma.wish.count({ where: { eventId: event.id } })).toBe(WISH_PER_GUEST_LIMIT);
  });

  it("does not count a deleted wish toward the per-guest cap", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(event.id);

    for (let i = 0; i < WISH_PER_GUEST_LIMIT; i++) {
      await submitWishForGuest(event.id, invitation.token, validWish);
    }
    const [firstWish] = await prisma.wish.findMany({ where: { eventId: event.id } });
    await deleteWishForUser(event.id, owner.id, firstWish.id);

    await expect(
      submitWishForGuest(event.id, invitation.token, validWish),
    ).resolves.toBeUndefined();
  });

  it("never leaks a second guest's identity — two different guests each get their own independent cap", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { invitation: invitationA } = await createTestGuest(event.id, "Guest A");
    const { invitation: invitationB } = await createTestGuest(event.id, "Guest B");

    for (let i = 0; i < WISH_PER_GUEST_LIMIT; i++) {
      await submitWishForGuest(event.id, invitationA.token, validWish);
    }

    await expect(
      submitWishForGuest(event.id, invitationB.token, validWish),
    ).resolves.toBeUndefined();
  });
});

describe("getWishesForModeration (integration — live Supabase DEV database)", () => {
  it("lets a VIEWER-role member read the list (read-only boundary)", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const { invitation } = await createTestGuest(event.id);
    await submitWishForGuest(event.id, invitation.token, validWish);

    const data = await getWishesForModeration(event.id, viewer.id, { status: "ALL", page: 1 });
    expect(data.role).toBe("VIEWER");
    expect(data.wishes).toHaveLength(1);
    expect(data.wishes[0].guestName).toBe("Ayu Lestari");
    expect(data.wishes[0].status).toBe(WishStatus.PENDING);
  });

  it("rejects a user with no relationship to the event", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(
      getWishesForModeration(event.id, stranger.id, { status: "ALL", page: 1 }),
    ).rejects.toThrow(EventNotFoundError);
  });

  it("the default ALL filter excludes deleted wishes; an explicit DELETED filter includes them", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(event.id);
    await submitWishForGuest(event.id, invitation.token, validWish);
    const [wish] = await prisma.wish.findMany({ where: { eventId: event.id } });
    await deleteWishForUser(event.id, owner.id, wish.id);

    const allData = await getWishesForModeration(event.id, owner.id, { status: "ALL", page: 1 });
    expect(allData.wishes).toHaveLength(0);

    const deletedData = await getWishesForModeration(event.id, owner.id, {
      status: "DELETED",
      page: 1,
    });
    expect(deletedData.wishes).toHaveLength(1);
  });

  it("never returns another event's wishes", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(eventA.id);
    await submitWishForGuest(eventA.id, invitation.token, validWish);

    const data = await getWishesForModeration(eventB.id, owner.id, { status: "ALL", page: 1 });
    expect(data.wishes).toEqual([]);
  });
});

describe("approveWishForUser / hideWishForUser / deleteWishForUser (integration — live Supabase DEV database)", () => {
  async function seedPendingWish(eventId: string) {
    const { invitation } = await createTestGuest(eventId);
    await submitWishForGuest(eventId, invitation.token, validWish);
    const [wish] = await prisma.wish.findMany({ where: { eventId } });
    return wish;
  }

  it("lets the owner approve a wish", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const wish = await seedPendingWish(event.id);

    await approveWishForUser(event.id, owner.id, wish.id);

    const stored = await prisma.wish.findUnique({ where: { id: wish.id } });
    expect(stored?.status).toBe(WishStatus.APPROVED);
  });

  it("lets an EDITOR-role member hide a wish", async () => {
    const owner = await createTestUser("owner");
    const editor = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, editor.id, EventMemberRole.EDITOR);
    const wish = await seedPendingWish(event.id);

    await hideWishForUser(event.id, editor.id, wish.id);

    const stored = await prisma.wish.findUnique({ where: { id: wish.id } });
    expect(stored?.status).toBe(WishStatus.HIDDEN);
  });

  it("rejects a VIEWER-role member attempting to moderate", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const wish = await seedPendingWish(event.id);

    await expect(approveWishForUser(event.id, viewer.id, wish.id)).rejects.toThrow(
      EventNotFoundError,
    );

    const stored = await prisma.wish.findUnique({ where: { id: wish.id } });
    expect(stored?.status).toBe(WishStatus.PENDING);
  });

  it("rejects a user with no relationship to the event", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);
    const wish = await seedPendingWish(event.id);

    await expect(approveWishForUser(event.id, stranger.id, wish.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("rejects moderating a wish under the wrong event id, and leaves the real row untouched (cross-event IDOR)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const wish = await seedPendingWish(eventA.id);

    await expect(approveWishForUser(eventB.id, owner.id, wish.id)).rejects.toThrow(
      WishNotFoundError,
    );

    const stored = await prisma.wish.findUnique({ where: { id: wish.id } });
    expect(stored?.status).toBe(WishStatus.PENDING);
    expect(stored?.eventId).toBe(eventA.id);
  });

  it("soft-deletes a wish (row still exists, status DELETED) rather than removing the row", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const wish = await seedPendingWish(event.id);

    await deleteWishForUser(event.id, owner.id, wish.id);

    const stored = await prisma.wish.findUnique({ where: { id: wish.id } });
    expect(stored).not.toBeNull();
    expect(stored?.status).toBe(WishStatus.DELETED);
  });

  it("a HIDDEN wish can be re-approved", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const wish = await seedPendingWish(event.id);
    await hideWishForUser(event.id, owner.id, wish.id);

    await approveWishForUser(event.id, owner.id, wish.id);

    const stored = await prisma.wish.findUnique({ where: { id: wish.id } });
    expect(stored?.status).toBe(WishStatus.APPROVED);
  });
});
