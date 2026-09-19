/**
 * Integration tests for the RSVP domain/service layer, run against the
 * real Supabase DEV Postgres database via Prisma (no mocks) — same
 * rationale as lib/events/, lib/invitations/, lib/editor/, and
 * lib/guests/: token resolution, cross-event IDOR defense, seat-quota
 * enforcement, and upsert/uniqueness behavior all need to be proven
 * against real queries, not a mocked Prisma client.
 *
 * Every row created here is deleted in `afterEach` via cascading deletes
 * off the tracked Event/User ids, regardless of test outcome.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { EventMemberRole, GuestInvitationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  EventNotFoundError,
  InvalidRsvpTokenError,
  SeatQuotaExceededError,
} from "@/lib/rsvp/errors";
import { getRsvpDashboardData, getRsvpGuestView, submitRsvpForGuest } from "@/lib/rsvp/service";
import type { RsvpFormInput } from "@/lib/rsvp/validation";

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
      id: `test-rsvp-${label}-${randomUUID()}`,
      email: `test-rsvp-${label}-${randomUUID()}@example.invalid`,
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
      title: "Pernikahan RSVP Uji Coba",
      slug: `test-rsvp-slug-${randomUUID()}`,
      status: "DRAFT",
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function addMember(eventId: string, userId: string, role: EventMemberRole) {
  await prisma.eventMember.create({ data: { eventId, userId, role } });
}

async function createTestGuest(eventId: string, seatQuota = 4) {
  const guest = await prisma.guest.create({
    data: {
      eventId,
      name: "Ayu Lestari",
      normalizedName: "ayu lestari",
      seatQuota,
    },
  });
  const invitation = await prisma.guestInvitation.create({
    data: { eventId, guestId: guest.id, token: randomUUID().replace(/-/g, "") },
  });
  return { guest, invitation };
}

const attending: RsvpFormInput = {
  attendance: "ATTENDING",
  attendeeCount: 2,
  message: "Sampai jumpa!",
};

describe("getRsvpGuestView (integration — live Supabase DEV database)", () => {
  it("resolves a valid token to the guest's view with no existing RSVP", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(event.id, 3);

    const view = await getRsvpGuestView(event.id, invitation.token);
    expect(view).toEqual({ guestName: "Ayu Lestari", seatQuota: 3, existing: null });
  });

  it("reflects an existing RSVP row", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest, invitation } = await createTestGuest(event.id, 3);
    await prisma.rSVP.create({
      data: {
        eventId: event.id,
        guestId: guest.id,
        attendance: "MAYBE",
        attendeeCount: 0,
        submittedAt: new Date(),
      },
    });

    const view = await getRsvpGuestView(event.id, invitation.token);
    expect(view?.existing).toEqual({ attendance: "MAYBE", attendeeCount: 0, message: null });
  });

  it("returns null for a malformed token", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    expect(await getRsvpGuestView(event.id, "short")).toBeNull();
  });

  it("returns null for an unknown token", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    expect(await getRsvpGuestView(event.id, randomUUID().replace(/-/g, ""))).toBeNull();
  });

  it("returns null for a token belonging to a different event (cross-event protection)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(eventA.id);

    expect(await getRsvpGuestView(eventB.id, invitation.token)).toBeNull();
  });
});

describe("submitRsvpForGuest (integration)", () => {
  it("creates a new RSVP and advances the invitation status to RSVPED", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest, invitation } = await createTestGuest(event.id, 4);

    const result = await submitRsvpForGuest(event.id, invitation.token, attending);
    expect(result).toEqual({ attendance: "ATTENDING", attendeeCount: 2, message: "Sampai jumpa!" });

    const stored = await prisma.rSVP.findUnique({
      where: { eventId_guestId: { eventId: event.id, guestId: guest.id } },
    });
    expect(stored?.attendance).toBe("ATTENDING");
    expect(stored?.submittedAt).not.toBeNull();

    const updatedInvitation = await prisma.guestInvitation.findUnique({
      where: { id: invitation.id },
    });
    expect(updatedInvitation?.status).toBe(GuestInvitationStatus.RSVPED);
  });

  it("updates (upserts) an existing RSVP rather than creating a duplicate row", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest, invitation } = await createTestGuest(event.id, 4);

    await submitRsvpForGuest(event.id, invitation.token, attending);
    await submitRsvpForGuest(event.id, invitation.token, {
      attendance: "NOT_ATTENDING",
      attendeeCount: 0,
      message: null,
    });

    const rows = await prisma.rSVP.findMany({ where: { eventId: event.id, guestId: guest.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].attendance).toBe("NOT_ATTENDING");
  });

  it("forces attendeeCount to 0 for a NOT_ATTENDING answer even if a nonzero count was submitted", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(event.id, 4);

    const result = await submitRsvpForGuest(event.id, invitation.token, {
      attendance: "NOT_ATTENDING",
      attendeeCount: 7,
      message: null,
    });

    expect(result.attendeeCount).toBe(0);
  });

  it("rejects an attendee count above the guest's own seat quota", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(event.id, 2);

    await expect(
      submitRsvpForGuest(event.id, invitation.token, {
        attendance: "ATTENDING",
        attendeeCount: 3,
        message: null,
      }),
    ).rejects.toThrow(SeatQuotaExceededError);
  });

  it("rejects a malformed token", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await expect(submitRsvpForGuest(event.id, "short", attending)).rejects.toThrow(
      InvalidRsvpTokenError,
    );
  });

  it("rejects an unknown token", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await expect(
      submitRsvpForGuest(event.id, randomUUID().replace(/-/g, ""), attending),
    ).rejects.toThrow(InvalidRsvpTokenError);
  });

  it("rejects a token belonging to a different event — cross-event guest manipulation is impossible", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const { guest, invitation } = await createTestGuest(eventA.id);

    await expect(submitRsvpForGuest(eventB.id, invitation.token, attending)).rejects.toThrow(
      InvalidRsvpTokenError,
    );

    // Confirm nothing was written under either event for this guest.
    expect(await prisma.rSVP.findFirst({ where: { guestId: guest.id } })).toBeNull();
  });

  it("never downgrades an already CHECKED_IN invitation back to RSVPED", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(event.id, 4);
    await prisma.guestInvitation.update({
      where: { id: invitation.id },
      data: { status: GuestInvitationStatus.CHECKED_IN },
    });

    await submitRsvpForGuest(event.id, invitation.token, attending);

    const updated = await prisma.guestInvitation.findUnique({ where: { id: invitation.id } });
    expect(updated?.status).toBe(GuestInvitationStatus.CHECKED_IN);
  });

  it("the database itself rejects a second RSVP row for the same event+guest (unique constraint)", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest } = await createTestGuest(event.id);

    await prisma.rSVP.create({
      data: { eventId: event.id, guestId: guest.id, attendance: "MAYBE", attendeeCount: 0 },
    });

    await expect(
      prisma.rSVP.create({
        data: { eventId: event.id, guestId: guest.id, attendance: "ATTENDING", attendeeCount: 1 },
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });
});

describe("getRsvpDashboardData — authorization and event scoping (integration)", () => {
  it("lets the owner read the dashboard", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await createTestGuest(event.id);

    const data = await getRsvpDashboardData(event.id, owner.id, 1);
    expect(data.counts.totalGuests).toBe(1);
    expect(data.role).toBe("OWNER");
  });

  it("lets a VIEWER-role member read the dashboard", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    await createTestGuest(event.id);

    const data = await getRsvpDashboardData(event.id, viewer.id, 1);
    expect(data.counts.totalGuests).toBe(1);
    expect(data.role).toBe("VIEWER");
  });

  it("rejects a stranger", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(getRsvpDashboardData(event.id, stranger.id, 1)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("rejects a nonexistent event id", async () => {
    const owner = await createTestUser("owner");
    await expect(getRsvpDashboardData(`missing-${randomUUID()}`, owner.id, 1)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("never counts a guest/RSVP from a different event", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const { invitation } = await createTestGuest(eventA.id);
    await submitRsvpForGuest(eventA.id, invitation.token, attending);

    const dataB = await getRsvpDashboardData(eventB.id, owner.id, 1);
    expect(dataB.counts.totalGuests).toBe(0);
    expect(dataB.counts.attending).toBe(0);
  });

  it("computes accurate counts across multiple guests and attendance states", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const g1 = await createTestGuest(event.id, 3);
    const g2 = await createTestGuest(event.id, 2);
    await createTestGuest(event.id, 1); // never responds — stays pending

    await submitRsvpForGuest(event.id, g1.invitation.token, {
      attendance: "ATTENDING",
      attendeeCount: 2,
      message: null,
    });
    await submitRsvpForGuest(event.id, g2.invitation.token, {
      attendance: "NOT_ATTENDING",
      attendeeCount: 0,
      message: null,
    });

    const data = await getRsvpDashboardData(event.id, owner.id, 1);
    expect(data.counts.totalGuests).toBe(3);
    expect(data.counts.totalResponded).toBe(2);
    expect(data.counts.totalPending).toBe(1);
    expect(data.counts.attending).toBe(1);
    expect(data.counts.notAttending).toBe(1);
    expect(data.counts.confirmedSeats).toBe(2);
    expect(data.counts.totalSeatsInvited).toBe(6);
  });
});
