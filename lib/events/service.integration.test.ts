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
import {
  EventNotFoundError,
  EventTypeImmutableError,
  PublishRequirementsNotMetError,
  SlugConflictError,
} from "@/lib/events/errors";
import {
  createEventForUser,
  deleteEventForUser,
  getEventForUser,
  getPublishReadinessForUser,
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

/** The two names a Wedding needs before it can be published. */
async function addCoupleNames(eventId: string) {
  await prisma.weddingProfile.create({
    data: { eventId, brideNickname: "Ayu", groomNickname: "Budi" },
  });
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
    await addCoupleNames(event.id);

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
    await addCoupleNames(event.id);
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

describe("EventType immutability (integration)", () => {
  it("rejects changing WEDDING → BIRTHDAY and leaves the stored type and profile untouched", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));
    await addCoupleNames(event.id);

    await expect(
      updateEventForUser(event.id, userA.id, {
        ...validInput({ slug: event.slug }),
        type: "BIRTHDAY",
      }),
    ).rejects.toThrow(EventTypeImmutableError);

    const stored = await prisma.event.findUniqueOrThrow({
      where: { id: event.id },
      include: { weddingProfile: true },
    });
    expect(stored.type).toBe("WEDDING");
    expect(stored.weddingProfile?.brideNickname).toBe("Ayu");
  });

  it("accepts an update that omits the type or repeats the same type", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    const withoutType = { title: "Tanpa Tipe", slug: event.slug, description: undefined };
    await expect(updateEventForUser(event.id, userA.id, withoutType)).resolves.toMatchObject({
      title: "Tanpa Tipe",
      type: "WEDDING",
    });
    await expect(
      updateEventForUser(event.id, userA.id, validInput({ slug: event.slug, type: "WEDDING" })),
    ).resolves.toMatchObject({ type: "WEDDING" });
  });

  it("a stranger's type-change attempt is an IDOR not-found, not a type error", async () => {
    const userA = await createTestUser("a");
    const userB = await createTestUser("b");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    await expect(
      updateEventForUser(event.id, userB.id, {
        ...validInput({ slug: event.slug }),
        type: "OTHER",
      }),
    ).rejects.toThrow(EventNotFoundError);
  });
});

describe("publish readiness (integration)", () => {
  it("blocks publishing a Wedding without both couple names, listing what's missing", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    const error = await publishEventForUser(event.id, userA.id).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PublishRequirementsNotMetError);
    expect((error as PublishRequirementsNotMetError).missing).toEqual([
      "Nama Mempelai Wanita",
      "Nama Mempelai Pria",
    ]);

    const stillDraft = await getEventForUser(event.id, userA.id);
    expect(stillDraft.status).toBe("DRAFT");
  });

  it("requires the celebrant, a date, and a venue for a Birthday (F4-09 §4.4), then publishes once all exist", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(
      await createEventForUser(userA.id, validInput({ type: "BIRTHDAY", title: "Ulang Tahun" })),
    );

    expect((await getPublishReadinessForUser(event.id, userA.id)).missing).toEqual([
      "Nama yang berulang tahun",
      "Tanggal acara (tambahkan minimal satu jadwal)",
    ]);

    await prisma.personProfile.create({ data: { eventId: event.id, fullName: "Citra" } });
    await prisma.eventSchedule.create({
      data: {
        eventId: event.id,
        title: "Pesta",
        date: new Date("2026-12-12T00:00:00Z"),
        startTime: new Date("1970-01-01T18:00:00Z"),
        endTime: new Date("1970-01-01T21:00:00Z"),
      },
    });

    // A date without a venue is not enough (F4-09 §4.4).
    expect((await getPublishReadinessForUser(event.id, userA.id)).missing).toEqual([
      "Lokasi acara (tambahkan venue pada jadwal yang belum memiliki lokasi)",
    ]);
    await expect(publishEventForUser(event.id, userA.id)).rejects.toThrow(
      PublishRequirementsNotMetError,
    );

    const venue = await prisma.venue.create({
      data: { eventId: event.id, name: "Gedung Serbaguna", address: "Jl. Uji Coba No. 1" },
    });
    await prisma.eventSchedule.updateMany({
      where: { eventId: event.id },
      data: { venueId: venue.id },
    });

    expect((await getPublishReadinessForUser(event.id, userA.id)).missing).toEqual([]);
    await expect(publishEventForUser(event.id, userA.id)).resolves.toMatchObject({
      status: "PUBLISHED",
    });
  });

  it("does not let a stale profile of another family satisfy the requirement", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(
      await createEventForUser(userA.id, validInput({ type: "CORPORATE", title: "Rapat" })),
    );
    // A couple profile row (e.g. inserted out-of-band) never counts for CORPORATE.
    await addCoupleNames(event.id);

    await expect(publishEventForUser(event.id, userA.id)).rejects.toThrow(
      PublishRequirementsNotMetError,
    );
  });

  it("Wedding with 1 agenda does not require a venue (F4-09 §4.3) — publishes with only the couple's names", async () => {
    const userA = await createTestUser("a");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));
    await addCoupleNames(event.id);

    expect((await getPublishReadinessForUser(event.id, userA.id)).missing).toEqual([]);
    await expect(publishEventForUser(event.id, userA.id)).resolves.toMatchObject({
      status: "PUBLISHED",
    });
  });

  async function createSchedule(eventId: string, title: string, venueId: string | null) {
    return prisma.eventSchedule.create({
      data: {
        eventId,
        title,
        date: new Date("2026-12-12T00:00:00Z"),
        startTime: new Date("1970-01-01T08:00:00Z"),
        endTime: new Date("1970-01-01T10:00:00Z"),
        venueId,
      },
    });
  }

  describe("F4-09 agenda count & venue rule (real database)", () => {
    it("Wedding: a 2nd agenda is allowed and publishes once both agendas have a venue", async () => {
      const userA = await createTestUser("a");
      const event = trackEvent(await createEventForUser(userA.id, validInput()));
      await addCoupleNames(event.id);
      const venueA = await prisma.venue.create({
        data: { eventId: event.id, name: "Gedung A", address: "Jl. A" },
      });
      const venueB = await prisma.venue.create({
        data: { eventId: event.id, name: "Gedung B", address: "Jl. B" },
      });
      await createSchedule(event.id, "Akad Nikah", venueA.id);
      await createSchedule(event.id, "Resepsi", venueB.id);

      expect((await getPublishReadinessForUser(event.id, userA.id)).missing).toEqual([]);
      await expect(publishEventForUser(event.id, userA.id)).resolves.toMatchObject({
        status: "PUBLISHED",
      });
    });

    it("Wedding: a 2nd agenda without a venue blocks publishing, even though 1 agenda alone would not need one", async () => {
      const userA = await createTestUser("a");
      const event = trackEvent(await createEventForUser(userA.id, validInput()));
      await addCoupleNames(event.id);
      const venueA = await prisma.venue.create({
        data: { eventId: event.id, name: "Gedung A", address: "Jl. A" },
      });
      await createSchedule(event.id, "Akad Nikah", venueA.id);
      await createSchedule(event.id, "Resepsi", null);

      expect((await getPublishReadinessForUser(event.id, userA.id)).missing).toEqual([
        "Lokasi acara (tambahkan venue pada jadwal yang belum memiliki lokasi)",
      ]);
      await expect(publishEventForUser(event.id, userA.id)).rejects.toThrow(
        PublishRequirementsNotMetError,
      );
    });

    it("Wedding: a 3rd agenda blocks publishing regardless of venue completeness", async () => {
      const userA = await createTestUser("a");
      const event = trackEvent(await createEventForUser(userA.id, validInput()));
      await addCoupleNames(event.id);
      const venue = await prisma.venue.create({
        data: { eventId: event.id, name: "Gedung", address: "Jl. Contoh" },
      });
      await createSchedule(event.id, "Akad Nikah", venue.id);
      await createSchedule(event.id, "Resepsi", venue.id);
      await createSchedule(event.id, "Ramah Tamah", venue.id);

      const error = await publishEventForUser(event.id, userA.id).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PublishRequirementsNotMetError);
      expect((error as PublishRequirementsNotMetError).missing).toEqual([
        "Jumlah jadwal melebihi batas maksimal (2 jadwal)",
      ]);
    });

    it("a non-Wedding type rejects a 2nd agenda even when both agendas have a venue (agenda-count ceiling, not just venue)", async () => {
      const userA = await createTestUser("a");
      const event = trackEvent(
        await createEventForUser(userA.id, validInput({ type: "CORPORATE", title: "Rapat" })),
      );
      await prisma.organizationProfile.create({
        data: { eventId: event.id, organizationName: "PT Maju" },
      });
      const venueA = await prisma.venue.create({
        data: { eventId: event.id, name: "Gedung A", address: "Jl. A" },
      });
      const venueB = await prisma.venue.create({
        data: { eventId: event.id, name: "Gedung B", address: "Jl. B" },
      });
      await createSchedule(event.id, "Sesi 1", venueA.id);
      await createSchedule(event.id, "Sesi 2", venueB.id);

      const error = await publishEventForUser(event.id, userA.id).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PublishRequirementsNotMetError);
      expect((error as PublishRequirementsNotMetError).missing).toEqual([
        "Jumlah jadwal melebihi batas maksimal (1 jadwal)",
      ]);
    });
  });

  it("a schedule with a venue satisfies the venue requirement for Gathering and Corporate (F4 §3.6/§3.7)", async () => {
    const userA = await createTestUser("a");

    for (const type of ["GATHERING", "CORPORATE"] as const) {
      const event = trackEvent(await createEventForUser(userA.id, validInput({ type })));
      if (type === "GATHERING") {
        await prisma.hostProfile.create({
          data: { eventId: event.id, hostName: "Keluarga Wiryo" },
        });
      } else {
        await prisma.organizationProfile.create({
          data: { eventId: event.id, organizationName: "PT Maju" },
        });
      }
      const venue = await prisma.venue.create({
        data: { eventId: event.id, name: "Gedung Serbaguna", address: "Jl. Uji Coba No. 1" },
      });
      await prisma.eventSchedule.create({
        data: {
          eventId: event.id,
          title: "Acara",
          date: new Date("2026-12-12T00:00:00Z"),
          startTime: new Date("1970-01-01T18:00:00Z"),
          endTime: new Date("1970-01-01T21:00:00Z"),
          venueId: venue.id,
        },
      });

      expect((await getPublishReadinessForUser(event.id, userA.id)).missing).toEqual([]);
      await expect(publishEventForUser(event.id, userA.id)).resolves.toMatchObject({
        status: "PUBLISHED",
      });
    }
  });

  it("readiness is VIEWER-and-above and IDOR-safe", async () => {
    const userA = await createTestUser("a");
    const userB = await createTestUser("b");
    const event = trackEvent(await createEventForUser(userA.id, validInput()));

    await expect(getPublishReadinessForUser(event.id, userB.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });
});
