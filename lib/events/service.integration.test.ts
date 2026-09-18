/**
 * Integration tests for the event domain/service layer, run against the
 * real Supabase DEV Postgres database via Prisma (no mocking of Prisma or
 * the database) — the only way to genuinely prove the authorization
 * WHERE-clauses actually enforce cross-tenant isolation, not just that a
 * mock was configured to return the "correct" answer.
 *
 * Every row created here is deleted in `afterEach`, regardless of whether
 * the test passed or failed, so this suite never leaves data behind in
 * the shared DEV database.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { EventNotFoundError, SlugConflictError } from "@/lib/events/errors";
import {
  createEventForUser,
  deleteEventForUser,
  getEventForUser,
  listEventsForUser,
  publishEventForUser,
  unpublishEventForUser,
  updateEventForUser,
} from "@/lib/events/service";
import type { CreateEventInput } from "@/lib/events/validation";

const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

afterEach(async () => {
  // Events first: Event.owner is `onDelete: Restrict`, so a user with a
  // remaining owned event can't be deleted.
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
      id: `test-events-${label}-${randomUUID()}`,
      email: `test-events-${label}-${randomUUID()}@example.invalid`,
      name: `Test User ${label}`,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

function trackEvent<T extends { id: string }>(event: T): T {
  createdEventIds.push(event.id);
  return event;
}

function validInput(overrides: Partial<CreateEventInput> = {}): CreateEventInput {
  return {
    title: "Pernikahan Uji Coba",
    type: "WEDDING",
    slug: `test-slug-${randomUUID()}`,
    description: undefined,
    ...overrides,
  };
}

describe("event service (integration — live Supabase DEV database)", () => {
  it("A: lets a user create an event", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    expect(event.ownerId).toBe(userA.id);
  });

  it("B: lets a user list their own events", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    const events = await listEventsForUser(userA.id);
    expect(events.map((e) => e.id)).toContain(event.id);
  });

  it("C: lets a user retrieve their own event", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    const fetched = await getEventForUser(event.id, userA.id);
    expect(fetched.id).toBe(event.id);
  });

  it("D: lets a user update their own event", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    const updated = await updateEventForUser(
      event.id,
      userA.id,
      validInput({ title: "Judul Baru", slug: event.slug }),
    );

    expect(updated.title).toBe("Judul Baru");
  });

  it("E: lets a user delete their own event", async () => {
    const userA = await createTestUser("a");
    const event = await createEventForUser(userA.id, validInput());

    await deleteEventForUser(event.id, userA.id);

    await expect(getEventForUser(event.id, userA.id)).rejects.toThrow(EventNotFoundError);
  });

  it("F: prevents another user from retrieving the event (IDOR)", async () => {
    const userA = await createTestUser("a");
    const userB = await createTestUser("b");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    await expect(getEventForUser(event.id, userB.id)).rejects.toThrow(EventNotFoundError);
  });

  it("G: prevents another user from updating the event (IDOR)", async () => {
    const userA = await createTestUser("a");
    const userB = await createTestUser("b");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    await expect(
      updateEventForUser(event.id, userB.id, validInput({ title: "Diretas", slug: event.slug })),
    ).rejects.toThrow(EventNotFoundError);

    const stillOriginal = await getEventForUser(event.id, userA.id);
    expect(stillOriginal.title).not.toBe("Diretas");
  });

  it("H: prevents another user from deleting the event (IDOR)", async () => {
    const userA = await createTestUser("a");
    const userB = await createTestUser("b");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    await expect(deleteEventForUser(event.id, userB.id)).rejects.toThrow(EventNotFoundError);

    const stillThere = await getEventForUser(event.id, userA.id);
    expect(stillThere.id).toBe(event.id);
  });

  it("treats a nonexistent event id the same as an unauthorized one for read/update/delete", async () => {
    const userA = await createTestUser("a");
    const missingId = `missing-${randomUUID()}`;

    await expect(getEventForUser(missingId, userA.id)).rejects.toThrow(EventNotFoundError);
    await expect(updateEventForUser(missingId, userA.id, validInput())).rejects.toThrow(
      EventNotFoundError,
    );
    await expect(deleteEventForUser(missingId, userA.id)).rejects.toThrow(EventNotFoundError);
  });

  it("J: rejects creating an event whose slug is already taken", async () => {
    const userA = await createTestUser("a");
    const userB = await createTestUser("b");
    const slug = `dup-slug-${randomUUID()}`;

    trackEvent(await createEventForUser(userA.id, validInput({ slug })));

    await expect(createEventForUser(userB.id, validInput({ slug }))).rejects.toThrow(
      SlugConflictError,
    );
  });

  it("J: rejects updating an event to a slug already taken by another event", async () => {
    const userA = await createTestUser("a");
    const eventOne = trackEvent(await createEventForUser(userA.id, validInput()));
    const eventTwo = trackEvent(await createEventForUser(userA.id, validInput()));

    await expect(
      updateEventForUser(eventTwo.id, userA.id, validInput({ slug: eventOne.slug })),
    ).rejects.toThrow(SlugConflictError);
  });

  it("R: lets the owner publish and then unpublish their own event", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));
    expect(event.status).toBe("DRAFT");

    const published = await publishEventForUser(event.id, userA.id);
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).not.toBeNull();

    const unpublished = await unpublishEventForUser(event.id, userA.id);
    expect(unpublished.status).toBe("DRAFT");
  });

  it("S: prevents another user from publishing the event (IDOR)", async () => {
    const userA = await createTestUser("a");
    const userB = await createTestUser("b");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    await expect(publishEventForUser(event.id, userB.id)).rejects.toThrow(EventNotFoundError);

    const stillDraft = await getEventForUser(event.id, userA.id);
    expect(stillDraft.status).toBe("DRAFT");
  });

  it("T: prevents another user from unpublishing the event (IDOR)", async () => {
    const userA = await createTestUser("a");
    const userB = await createTestUser("b");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));
    await publishEventForUser(event.id, userA.id);

    await expect(unpublishEventForUser(event.id, userB.id)).rejects.toThrow(EventNotFoundError);

    const stillPublished = await getEventForUser(event.id, userA.id);
    expect(stillPublished.status).toBe("PUBLISHED");
  });

  it("publish/unpublish reject a nonexistent event id", async () => {
    const userA = await createTestUser("a");
    const missingId = `missing-${randomUUID()}`;

    await expect(publishEventForUser(missingId, userA.id)).rejects.toThrow(EventNotFoundError);
    await expect(unpublishEventForUser(missingId, userA.id)).rejects.toThrow(EventNotFoundError);
  });
});
