/**
 * Integration tests for the analytics domain/service layer, run against
 * the real Supabase DEV Postgres database via Prisma (no mocks) — same
 * rationale as lib/checkin/, lib/wishes/, lib/rsvp/: authorization,
 * cross-event IDOR defense, guest-token resolution, and the view
 * deduplication window all need to be proven against real queries, not a
 * mocked Prisma client.
 *
 * Every row created here is deleted in `afterEach` via cascading deletes
 * off the tracked Event/User ids, regardless of test outcome.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { EventMemberRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { EventNotFoundError } from "@/lib/analytics/errors";
import { getAnalyticsDashboardData, trackPublicInvitationView } from "@/lib/analytics/service";

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
      id: `test-analytics-${label}-${randomUUID()}`,
      email: `test-analytics-${label}-${randomUUID()}@example.invalid`,
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
      title: "Pernikahan Analitik Uji Coba",
      slug: `test-analytics-slug-${randomUUID()}`,
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
  const token = randomUUID().replace(/-/g, "");
  const invitation = await prisma.guestInvitation.create({
    data: { eventId, guestId: guest.id, token },
  });
  return { guest, invitation, token };
}

function newSessionId(): string {
  return randomUUID();
}

describe("trackPublicInvitationView (integration — live Supabase DEV database)", () => {
  it("creates an InvitationView row for an anonymous (non-personalized) visit", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const sessionId = newSessionId();

    await trackPublicInvitationView({
      eventId: event.id,
      guestToken: null,
      hasPersonalizationContext: false,
      sessionId,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      referrer: "https://www.google.com/search?q=undangan",
    });

    const rows = await prisma.invitationView.findMany({ where: { eventId: event.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].sessionId).toBe(sessionId);
    expect(rows[0].guestId).toBeNull();
    expect(rows[0].deviceType).toBe("DESKTOP");
    expect(rows[0].referrer).toBe("https://www.google.com");
  });

  it("associates the correct guestId when a valid, event-scoped personalized token is used", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest, token } = await createTestGuest(event.id, "Budi Santoso");
    const sessionId = newSessionId();

    await trackPublicInvitationView({
      eventId: event.id,
      guestToken: token,
      hasPersonalizationContext: true,
      sessionId,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      referrer: null,
    });

    const rows = await prisma.invitationView.findMany({ where: { eventId: event.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].guestId).toBe(guest.id);
    expect(rows[0].deviceType).toBe("MOBILE");
  });

  it("never assigns a guestId from a token belonging to a different event (cross-event IDOR)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const { token } = await createTestGuest(eventB.id, "Citra Dewi");
    const sessionId = newSessionId();

    await trackPublicInvitationView({
      eventId: eventA.id,
      guestToken: token,
      hasPersonalizationContext: true,
      sessionId,
      userAgent: null,
      referrer: null,
    });

    const rows = await prisma.invitationView.findMany({ where: { eventId: eventA.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].guestId).toBeNull();
  });

  it("leaves guestId null for a malformed/unknown token", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const sessionId = newSessionId();

    await trackPublicInvitationView({
      eventId: event.id,
      guestToken: "not-a-real-token",
      hasPersonalizationContext: true,
      sessionId,
      userAgent: null,
      referrer: null,
    });

    const rows = await prisma.invitationView.findMany({ where: { eventId: event.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].guestId).toBeNull();
  });

  it("does not create a row and does not throw when sessionId is missing", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    await expect(
      trackPublicInvitationView({
        eventId: event.id,
        guestToken: null,
        hasPersonalizationContext: false,
        sessionId: null,
        userAgent: null,
        referrer: null,
      }),
    ).resolves.toBeUndefined();

    expect(await prisma.invitationView.count({ where: { eventId: event.id } })).toBe(0);
  });

  it("never throws even for a nonexistent eventId (foreign-key failure is swallowed, not surfaced)", async () => {
    await expect(
      trackPublicInvitationView({
        eventId: "nonexistent-event-id",
        guestToken: null,
        hasPersonalizationContext: false,
        sessionId: newSessionId(),
        userAgent: null,
        referrer: null,
      }),
    ).resolves.toBeUndefined();
  });

  it("deduplicates repeated views from the same eventId+sessionId within the tracking window", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const sessionId = newSessionId();

    await trackPublicInvitationView({
      eventId: event.id,
      guestToken: null,
      hasPersonalizationContext: false,
      sessionId,
      userAgent: null,
      referrer: null,
    });
    await trackPublicInvitationView({
      eventId: event.id,
      guestToken: null,
      hasPersonalizationContext: false,
      sessionId,
      userAgent: null,
      referrer: null,
    });

    expect(await prisma.invitationView.count({ where: { eventId: event.id } })).toBe(1);
  });

  it("counts a different session for the same event as a separate view (dedup is per-session, not per-event)", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    await trackPublicInvitationView({
      eventId: event.id,
      guestToken: null,
      hasPersonalizationContext: false,
      sessionId: newSessionId(),
      userAgent: null,
      referrer: null,
    });
    await trackPublicInvitationView({
      eventId: event.id,
      guestToken: null,
      hasPersonalizationContext: false,
      sessionId: newSessionId(),
      userAgent: null,
      referrer: null,
    });

    expect(await prisma.invitationView.count({ where: { eventId: event.id } })).toBe(2);
  });
});

describe("getAnalyticsDashboardData (integration — live Supabase DEV database)", () => {
  it("lets OWNER, EDITOR, and VIEWER read; rejects a stranger", async () => {
    const [owner, editor, viewer, stranger] = await Promise.all([
      createTestUser("owner"),
      createTestUser("editor"),
      createTestUser("viewer"),
      createTestUser("stranger"),
    ]);
    const event = await createTestEvent(owner.id);
    await Promise.all([
      addMember(event.id, editor.id, EventMemberRole.EDITOR),
      addMember(event.id, viewer.id, EventMemberRole.VIEWER),
    ]);

    const [ownerData, editorData, viewerData] = await Promise.all([
      getAnalyticsDashboardData(event.id, owner.id),
      getAnalyticsDashboardData(event.id, editor.id),
      getAnalyticsDashboardData(event.id, viewer.id),
    ]);
    expect(ownerData.role).toBe(EventMemberRole.OWNER);
    expect(editorData.role).toBe(EventMemberRole.EDITOR);
    expect(viewerData.role).toBe(EventMemberRole.VIEWER);

    await expect(getAnalyticsDashboardData(event.id, stranger.id)).rejects.toThrow(
      EventNotFoundError,
    );
  }, 15000);

  it("never returns another event's analytics data (cross-event isolation)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    await createTestGuest(eventA.id, "Dedi Pratama");
    await trackPublicInvitationView({
      eventId: eventA.id,
      guestToken: null,
      hasPersonalizationContext: false,
      sessionId: newSessionId(),
      userAgent: null,
      referrer: null,
    });

    const dataB = await getAnalyticsDashboardData(eventB.id, owner.id);
    expect(dataB.invitation.totalViews).toBe(0);
    expect(dataB.rsvp.totalGuests).toBe(0);
  });

  it("returns safe zero/empty-state values for a brand-new event (no NaN/Infinity)", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const data = await getAnalyticsDashboardData(event.id, owner.id);

    expect(data.invitation).toEqual({ totalViews: 0, uniqueVisitors: 0, personalizedOpens: 0 });
    expect(data.rsvp.responseRate).toBe(0);
    expect(data.checkIn.progressRate).toBe(0);
    expect(data.checkIn.checkedIn).toBe(0);
    expect(data.checkIn.remainingConfirmed).toBe(0);
    expect(Number.isFinite(data.rsvp.responseRate)).toBe(true);
    expect(Number.isFinite(data.checkIn.progressRate)).toBe(true);
  });

  it("aggregates real invitation view, RSVP, wish, gift-method, and check-in data correctly", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const [{ guest: attending }, { guest: declined }] = await Promise.all([
      createTestGuest(event.id, "Eka Wijaya"),
      createTestGuest(event.id, "Fajar Nugroho"),
      createTestGuest(event.id, "Gita Permata"), // unanswered
    ]);

    await Promise.all([
      prisma.rSVP.create({
        data: {
          eventId: event.id,
          guestId: attending.id,
          attendance: "ATTENDING",
          attendeeCount: 2,
          submittedAt: new Date(),
        },
      }),
      prisma.rSVP.create({
        data: {
          eventId: event.id,
          guestId: declined.id,
          attendance: "NOT_ATTENDING",
          attendeeCount: 0,
          submittedAt: new Date(),
        },
      }),
      // `declined` RSVP'd NOT_ATTENDING but still checks in (a real
      // walk-in scenario allowed by design — RSVP never gates check-in,
      // D-047) — checkedIn(2) exceeds confirmed(1), proving progressRate
      // clamps at 100 rather than exceeding it.
      prisma.checkIn.create({
        data: { eventId: event.id, guestId: attending.id, method: "MANUAL" },
      }),
      prisma.checkIn.create({
        data: { eventId: event.id, guestId: declined.id, method: "MANUAL" },
      }),
      prisma.wish.createMany({
        data: [
          {
            eventId: event.id,
            guestId: attending.id,
            name: "Eka",
            message: "Selamat!",
            status: "APPROVED",
          },
          {
            eventId: event.id,
            guestId: declined.id,
            name: "Fajar",
            message: "Selamat ya",
            status: "PENDING",
          },
          {
            eventId: event.id,
            guestId: attending.id,
            name: "Eka",
            message: "dihapus",
            status: "DELETED",
          },
        ],
      }),
      prisma.giftMethod.createMany({
        data: [
          { eventId: event.id, type: "BANK", isActive: true },
          { eventId: event.id, type: "EWALLET", isActive: false },
        ],
      }),
      trackPublicInvitationView({
        eventId: event.id,
        guestToken: null,
        hasPersonalizationContext: false,
        sessionId: newSessionId(),
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        referrer: null,
      }),
      trackPublicInvitationView({
        eventId: event.id,
        guestToken: null,
        hasPersonalizationContext: false,
        sessionId: newSessionId(),
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        referrer: null,
      }),
    ]);

    const data = await getAnalyticsDashboardData(event.id, owner.id);

    expect(data.invitation.totalViews).toBe(2);
    expect(data.invitation.uniqueVisitors).toBe(2);
    expect(data.invitation.personalizedOpens).toBe(0);

    expect(data.rsvp.totalGuests).toBe(3);
    expect(data.rsvp.confirmed).toBe(1);
    expect(data.rsvp.declined).toBe(1);
    expect(data.rsvp.maybe).toBe(0);
    expect(data.rsvp.unanswered).toBe(1);
    expect(data.rsvp.responseRate).toBe(67);

    expect(data.wishes.total).toBe(2); // excludes the DELETED wish
    expect(data.wishes.approved).toBe(1);

    expect(data.gifts.activeMethods).toBe(1);

    expect(data.checkIn.checkedIn).toBe(2);
    expect(data.checkIn.remainingConfirmed).toBe(0); // max(0, confirmed(1) - checkedIn(2))
    expect(data.checkIn.progressRate).toBe(100); // clamped — checkedIn(2) exceeds confirmed(1)
  }, 15000);
});
