/**
 * Integration tests for account deletion against the live Supabase DEV
 * database. Every row created here is removed in `afterEach`, also when a
 * test fails before the account is deleted.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { AccountDeleteBlockedError, deleteAccount } from "@/lib/account/service";
import { prisma } from "@/lib/db/prisma";

const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

afterEach(async () => {
  await prisma.payment.deleteMany({ where: { userId: { in: createdUserIds } } });
  if (createdEventIds.length) {
    await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
    createdEventIds.length = 0;
  }
  if (createdUserIds.length) {
    await prisma.auditLog.deleteMany({
      where: { OR: [{ userId: { in: createdUserIds } }, { resourceId: { in: createdUserIds } }] },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

async function createUser(label: string) {
  const user = await prisma.user.create({
    data: {
      id: `test-account-${label}-${randomUUID()}`,
      email: `test-account-${label}-${randomUUID()}@example.invalid`,
      name: `Test Account ${label}`,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createEvent(ownerId: string) {
  const event = await prisma.event.create({
    data: { ownerId, type: "WEDDING", title: "Acara Uji", slug: `test-account-${randomUUID()}` },
  });
  createdEventIds.push(event.id);
  return event;
}

describe("deleteAccount (integration — live Supabase DEV database)", () => {
  it("removes the user, their events with guests, and their membership elsewhere", async () => {
    const owner = await createUser("owner");
    const other = await createUser("other");
    const ownEvent = await createEvent(owner.id);
    const othersEvent = await createEvent(other.id);
    await prisma.guest.create({
      data: { eventId: ownEvent.id, name: "Tamu", normalizedName: "tamu" },
    });
    await prisma.eventMember.create({
      data: { eventId: othersEvent.id, userId: owner.id, role: "EDITOR" },
    });

    await deleteAccount(owner.id);

    expect(await prisma.user.findUnique({ where: { id: owner.id } })).toBeNull();
    expect(await prisma.event.findUnique({ where: { id: ownEvent.id } })).toBeNull();
    expect(await prisma.guest.count({ where: { eventId: ownEvent.id } })).toBe(0);
    expect(await prisma.eventMember.count({ where: { userId: owner.id } })).toBe(0);
    // Someone else's event is untouched.
    expect(await prisma.event.findUnique({ where: { id: othersEvent.id } })).not.toBeNull();

    const audit = await prisma.auditLog.findFirst({
      where: { action: "account.delete", resourceId: owner.id },
    });
    expect(audit?.userId).toBeNull();
    expect(audit?.metadata).toEqual({ deletedEvents: 1 });
  });

  it("refuses, and deletes nothing, while a payment record exists", async () => {
    const owner = await createUser("paid");
    const event = await createEvent(owner.id);
    await prisma.payment.create({
      data: { userId: owner.id, provider: "test", amount: "10000", status: "PAID" },
    });

    await expect(deleteAccount(owner.id)).rejects.toBeInstanceOf(AccountDeleteBlockedError);
    expect(await prisma.user.findUnique({ where: { id: owner.id } })).not.toBeNull();
    expect(await prisma.event.findUnique({ where: { id: event.id } })).not.toBeNull();
  });
});
