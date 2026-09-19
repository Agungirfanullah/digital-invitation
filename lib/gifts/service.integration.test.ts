/**
 * Integration tests for the gift-method domain/service layer, run against
 * the real Supabase DEV Postgres database via Prisma (no mocks) — same
 * rationale as lib/guests/ and lib/rsvp/: authorization and the
 * eventId-scoping IDOR defense need to be proven against real queries, not
 * a mocked Prisma client.
 *
 * Every row created here is deleted in `afterEach` via cascading deletes
 * off the tracked Event/User ids, regardless of test outcome.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { EventMemberRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { EventNotFoundError, GiftMethodNotFoundError } from "@/lib/gifts/errors";
import {
  createGiftMethodForUser,
  deleteGiftMethodForUser,
  getGiftMethodForEditor,
  getGiftMethodsForUser,
  updateGiftMethodForUser,
} from "@/lib/gifts/service";
import type { GiftMethodInput } from "@/lib/gifts/validation";

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
      id: `test-gifts-${label}-${randomUUID()}`,
      email: `test-gifts-${label}-${randomUUID()}@example.invalid`,
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
      title: "Pernikahan Hadiah Uji Coba",
      slug: `test-gifts-slug-${randomUUID()}`,
      status: "DRAFT",
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function addMember(eventId: string, userId: string, role: EventMemberRole) {
  await prisma.eventMember.create({ data: { eventId, userId, role } });
}

const validBankMethod: GiftMethodInput = {
  type: "BANK",
  providerName: "Bank Contoh",
  accountName: "Budi Santoso",
  accountNumber: "1234567890",
  qrImageUrl: null,
  instructions: null,
  isActive: true,
};

describe("createGiftMethodForUser (integration — live Supabase DEV database)", () => {
  it("lets the owner create a gift method", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const giftMethod = await createGiftMethodForUser(event.id, owner.id, validBankMethod);

    expect(giftMethod.providerName).toBe("Bank Contoh");
    expect(giftMethod.type).toBe("BANK");
    const stored = await prisma.giftMethod.findUnique({ where: { id: giftMethod.id } });
    expect(stored?.eventId).toBe(event.id);
  });

  it("lets an EDITOR-role member create a gift method", async () => {
    const owner = await createTestUser("owner");
    const editorUser = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, editorUser.id, EventMemberRole.EDITOR);

    const giftMethod = await createGiftMethodForUser(event.id, editorUser.id, validBankMethod);
    expect(giftMethod.providerName).toBe("Bank Contoh");
  });

  it("rejects a VIEWER-role member", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);

    await expect(createGiftMethodForUser(event.id, viewer.id, validBankMethod)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("rejects a user with no relationship to the event", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(createGiftMethodForUser(event.id, stranger.id, validBankMethod)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("rejects a nonexistent event id", async () => {
    const owner = await createTestUser("owner");
    await expect(
      createGiftMethodForUser(`missing-${randomUUID()}`, owner.id, validBankMethod),
    ).rejects.toThrow(EventNotFoundError);
  });

  it("sanitizes irrelevant fields for the persisted type (a QR method never stores accountName/accountNumber)", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const giftMethod = await createGiftMethodForUser(event.id, owner.id, {
      type: "QR",
      providerName: null,
      accountName: "should be dropped",
      accountNumber: "should be dropped",
      qrImageUrl: "https://example.com/qris.png",
      instructions: null,
      isActive: true,
    });

    expect(giftMethod.accountName).toBeNull();
    expect(giftMethod.accountNumber).toBeNull();
    expect(giftMethod.qrImageUrl).toBe("https://example.com/qris.png");
  });
});

describe("getGiftMethodsForUser (integration — live Supabase DEV database)", () => {
  it("lets a VIEWER-role member read the list (read-only boundary)", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    await createGiftMethodForUser(event.id, owner.id, validBankMethod);

    const data = await getGiftMethodsForUser(event.id, viewer.id);
    expect(data.role).toBe("VIEWER");
    expect(data.giftMethods).toHaveLength(1);
  });

  it("never returns another event's gift methods", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    await createGiftMethodForUser(eventA.id, owner.id, validBankMethod);

    const data = await getGiftMethodsForUser(eventB.id, owner.id);
    expect(data.giftMethods).toEqual([]);
  });

  it("rejects a user with no relationship to the event", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(getGiftMethodsForUser(event.id, stranger.id)).rejects.toThrow(EventNotFoundError);
  });
});

describe("getGiftMethodForEditor (integration — live Supabase DEV database)", () => {
  it("rejects a gift method id that belongs to a different event (IDOR-safe)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const giftMethod = await createGiftMethodForUser(eventA.id, owner.id, validBankMethod);

    await expect(getGiftMethodForEditor(eventB.id, owner.id, giftMethod.id)).rejects.toThrow(
      GiftMethodNotFoundError,
    );
  });

  it("rejects a VIEWER-role member (edit view requires EDITOR-and-above)", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const giftMethod = await createGiftMethodForUser(event.id, owner.id, validBankMethod);

    await expect(getGiftMethodForEditor(event.id, viewer.id, giftMethod.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });
});

describe("updateGiftMethodForUser (integration — live Supabase DEV database)", () => {
  it("lets the owner update a gift method", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const giftMethod = await createGiftMethodForUser(event.id, owner.id, validBankMethod);

    const updated = await updateGiftMethodForUser(event.id, owner.id, giftMethod.id, {
      ...validBankMethod,
      providerName: "Bank Baru",
    });
    expect(updated.providerName).toBe("Bank Baru");
  });

  it("rejects a VIEWER-role member", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const giftMethod = await createGiftMethodForUser(event.id, owner.id, validBankMethod);

    await expect(
      updateGiftMethodForUser(event.id, viewer.id, giftMethod.id, validBankMethod),
    ).rejects.toThrow(EventNotFoundError);
  });

  it("rejects updating a gift method id that belongs to a different event (IDOR-safe)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const giftMethod = await createGiftMethodForUser(eventA.id, owner.id, validBankMethod);

    await expect(
      updateGiftMethodForUser(eventB.id, owner.id, giftMethod.id, validBankMethod),
    ).rejects.toThrow(GiftMethodNotFoundError);

    // The method itself must be untouched by the rejected cross-event attempt.
    const stillEventA = await prisma.giftMethod.findUnique({ where: { id: giftMethod.id } });
    expect(stillEventA?.eventId).toBe(eventA.id);
    expect(stillEventA?.providerName).toBe("Bank Contoh");
  });
});

describe("deleteGiftMethodForUser (integration — live Supabase DEV database)", () => {
  it("lets the owner delete a gift method", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const giftMethod = await createGiftMethodForUser(event.id, owner.id, validBankMethod);

    await deleteGiftMethodForUser(event.id, owner.id, giftMethod.id);

    const stored = await prisma.giftMethod.findUnique({ where: { id: giftMethod.id } });
    expect(stored).toBeNull();
  });

  it("rejects a VIEWER-role member", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const giftMethod = await createGiftMethodForUser(event.id, owner.id, validBankMethod);

    await expect(deleteGiftMethodForUser(event.id, viewer.id, giftMethod.id)).rejects.toThrow(
      EventNotFoundError,
    );
    const stored = await prisma.giftMethod.findUnique({ where: { id: giftMethod.id } });
    expect(stored).not.toBeNull();
  });

  it("deleting a gift method under the wrong event id is rejected and event-scoped (IDOR-safe)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const giftMethodA = await createGiftMethodForUser(eventA.id, owner.id, validBankMethod);

    await expect(deleteGiftMethodForUser(eventB.id, owner.id, giftMethodA.id)).rejects.toThrow(
      GiftMethodNotFoundError,
    );

    const stillThere = await prisma.giftMethod.findUnique({ where: { id: giftMethodA.id } });
    expect(stillThere).not.toBeNull();
  });

  it("deleting one event's gift method never removes another event's", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const giftMethodA = await createGiftMethodForUser(eventA.id, owner.id, validBankMethod);
    const giftMethodB = await createGiftMethodForUser(eventB.id, owner.id, validBankMethod);

    await deleteGiftMethodForUser(eventA.id, owner.id, giftMethodA.id);

    const stillThere = await prisma.giftMethod.findUnique({ where: { id: giftMethodB.id } });
    expect(stillThere).not.toBeNull();
  });
});
