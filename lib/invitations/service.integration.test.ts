/**
 * Integration tests for the public invitation pipeline, run against the
 * real Supabase DEV Postgres database via Prisma (no mocks) — the same
 * rationale as lib/events/service.integration.test.ts: authorization and
 * privacy-projection correctness need to be proven against real queries,
 * not a mock configured to return the "correct" answer.
 *
 * Every row created here is deleted in `afterEach`, regardless of test
 * outcome, via cascading deletes off the tracked Event/User ids.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { InvitationNotFoundError } from "@/lib/invitations/errors";
import { getPublicInvitationBySlug } from "@/lib/invitations/service";

const createdUserIds: string[] = [];
const createdEventIds: string[] = [];

afterEach(async () => {
  // Seeded catalog Templates (e.g. "minimal-elegant") are read-only
  // fixtures here — never created or deleted by this suite.
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
      id: `test-invite-${label}-${randomUUID()}`,
      email: `test-invite-${label}-${randomUUID()}@example.invalid`,
      name: `Test User ${label}`,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createTestEvent(
  ownerId: string,
  overrides: Partial<Prisma.EventUncheckedCreateInput> = {},
) {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
      title: "Pernikahan Uji Coba",
      slug: `test-invite-slug-${randomUUID()}`,
      status: "PUBLISHED",
      ...overrides,
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function createTestGuestWithInvitation(eventId: string, name: string) {
  const guest = await prisma.guest.create({
    data: {
      eventId,
      name,
      normalizedName: name.toLowerCase(),
    },
  });
  const invitation = await prisma.guestInvitation.create({
    data: {
      eventId,
      guestId: guest.id,
      token: `test-token-${randomUUID()}`,
    },
  });
  return { guest, invitation };
}

describe("getPublicInvitationBySlug (integration — live Supabase DEV database)", () => {
  it("A: resolves a published event by slug", async () => {
    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id, { title: "Pernikahan A & B" });

    const invitation = await getPublicInvitationBySlug(event.slug);

    expect(invitation.eventId).toBe(event.id);
    expect(invitation.title).toBe("Pernikahan A & B");
  });

  it("B: throws InvitationNotFoundError for a slug that doesn't exist", async () => {
    await expect(getPublicInvitationBySlug(`nonexistent-${randomUUID()}`)).rejects.toThrow(
      InvitationNotFoundError,
    );
  });

  it("B: throws InvitationNotFoundError for a malformed slug rather than crashing", async () => {
    await expect(getPublicInvitationBySlug("a")).rejects.toThrow(InvitationNotFoundError);
    await expect(getPublicInvitationBySlug("INVALID SLUG !!")).rejects.toThrow(
      InvitationNotFoundError,
    );
  });

  it("C: does not expose a DRAFT event publicly", async () => {
    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id, { status: "DRAFT" });

    await expect(getPublicInvitationBySlug(event.slug)).rejects.toThrow(InvitationNotFoundError);
  });

  it("D: does not expose an ARCHIVED event publicly", async () => {
    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id, { status: "ARCHIVED" });

    await expect(getPublicInvitationBySlug(event.slug)).rejects.toThrow(InvitationNotFoundError);
  });

  it("does not expose a PUBLISHED event whose expiry has passed", async () => {
    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id, {
      status: "PUBLISHED",
      expiresAt: new Date(Date.now() - 1000 * 60 * 60),
    });

    await expect(getPublicInvitationBySlug(event.slug)).rejects.toThrow(InvitationNotFoundError);
  });

  it("E/F/G: the resolved invitation never carries owner/member/payment/audit data, even round-tripped through real Prisma relations", async () => {
    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id);
    await prisma.weddingProfile.create({
      data: { eventId: event.id, brideNickname: "Ayu", groomNickname: "Budi" },
    });

    const invitation = await getPublicInvitationBySlug(event.slug);
    const serialized = JSON.stringify(invitation);

    expect(invitation).not.toHaveProperty("ownerId");
    expect(invitation).not.toHaveProperty("owner");
    expect(invitation).not.toHaveProperty("members");
    expect(serialized).not.toContain(userA.id);
    expect(serialized).not.toContain(userA.email);
  });

  it("P/Q: renders real nested event data (schedule, venue, love story, gallery) and tolerates missing optional data", async () => {
    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id);

    const venue = await prisma.venue.create({
      data: { eventId: event.id, name: "Gedung Serbaguna", address: "Jl. Uji Coba No. 1" },
    });
    await prisma.eventSchedule.create({
      data: {
        eventId: event.id,
        title: "Akad Nikah",
        date: new Date("2026-12-12T00:00:00Z"),
        startTime: new Date("1970-01-01T08:00:00Z"),
        endTime: new Date("1970-01-01T10:00:00Z"),
        venueId: venue.id,
      },
    });
    const loveStory = await prisma.loveStory.create({
      data: { eventId: event.id, title: "Kisah Kami" },
    });
    await prisma.loveStoryItem.create({
      data: { loveStoryId: loveStory.id, title: "Pertama Bertemu", dateLabel: "2018" },
    });
    const gallery = await prisma.gallery.create({ data: { eventId: event.id } });
    await prisma.galleryItem.create({
      data: { galleryId: gallery.id, url: "https://example.com/photo.jpg" },
    });

    const invitation = await getPublicInvitationBySlug(event.slug);

    expect(invitation.schedules).toHaveLength(1);
    expect(invitation.schedules[0].venue?.name).toBe("Gedung Serbaguna");
    expect(invitation.loveStory?.items[0].title).toBe("Pertama Bertemu");
    expect(invitation.galleries[0].items[0].url).toBe("https://example.com/photo.jpg");
    // Optional data this event genuinely doesn't have — must not crash.
    expect(invitation.weddingProfile).toBeNull();
  });

  it("O: a malformed theme value on a real row falls back safely instead of crashing", async () => {
    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id);
    await prisma.theme.create({
      data: { eventId: event.id, backgroundImageUrl: "not-a-valid-url" },
    });

    const invitation = await getPublicInvitationBySlug(event.slug);
    expect(invitation.theme.backgroundImageUrl).toBeNull();
  });

  it("L/M: resolves a real seeded template and its theme correctly", async () => {
    const seededTemplate = await prisma.template.findUnique({
      where: { slug: "minimal-elegant" },
    });
    expect(seededTemplate).not.toBeNull();

    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id, { templateId: seededTemplate!.id });
    await prisma.theme.create({ data: { eventId: event.id, primaryColor: "#123456" } });

    const invitation = await getPublicInvitationBySlug(event.slug);

    expect(invitation.templateKey).toBe("minimal-elegant");
    expect(invitation.theme.primaryColor).toBe("#123456");
  });

  it("H: a valid guest token personalizes the correct event", async () => {
    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id);
    const { invitation: guestInvitation } = await createTestGuestWithInvitation(
      event.id,
      "Budi Santoso",
    );

    const invitation = await getPublicInvitationBySlug(event.slug, guestInvitation.token);

    expect(invitation.guest).toEqual({ displayName: "Budi Santoso" });
  });

  it("I: a token from Event A cannot personalize Event B (cross-event protection)", async () => {
    const userA = await createTestUser("a");
    const userB = await createTestUser("b");
    const eventA = await createTestEvent(userA.id);
    const eventB = await createTestEvent(userB.id);
    const { invitation: tokenForEventA } = await createTestGuestWithInvitation(
      eventA.id,
      "Guest Of A",
    );

    const invitation = await getPublicInvitationBySlug(eventB.slug, tokenForEventA.token);

    expect(invitation.guest).toBeNull();
  });

  it("J: an invalid/nonexistent token falls back to a generic invitation rather than erroring", async () => {
    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id);

    const withGarbageToken = await getPublicInvitationBySlug(event.slug, "!!!not-a-token!!!");
    expect(withGarbageToken.guest).toBeNull();

    const withUnknownToken = await getPublicInvitationBySlug(
      event.slug,
      `unknown-token-${randomUUID()}`,
    );
    expect(withUnknownToken.guest).toBeNull();
  });

  it("K: never exposes the guest list — resolving one guest's token never surfaces another guest's name", async () => {
    const userA = await createTestUser("a");
    const event = await createTestEvent(userA.id);
    const { invitation: tokenOne } = await createTestGuestWithInvitation(event.id, "Guest One");
    await createTestGuestWithInvitation(event.id, "Guest Two — Secret");

    const invitation = await getPublicInvitationBySlug(event.slug, tokenOne.token);
    const serialized = JSON.stringify(invitation);

    expect(invitation).not.toHaveProperty("guests");
    expect(invitation).not.toHaveProperty("guestList");
    expect(serialized).not.toContain("Guest Two");
  });
});
