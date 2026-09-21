/**
 * Integration tests for the check-in domain/service layer, run against the
 * real Supabase DEV Postgres database via Prisma (no mocks) — same
 * rationale as lib/rsvp/, lib/wishes/, lib/gifts/: authorization,
 * cross-event IDOR defense, token resolution, and — critically — the
 * database-unique-constraint-driven duplicate prevention and the
 * transactional CheckIn/GuestInvitation status sync all need to be proven
 * against real queries and a real transaction, not a mocked Prisma client.
 *
 * Every row created here is deleted in `afterEach` via cascading deletes
 * off the tracked Event/User ids, regardless of test outcome.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { CheckInMethod, EventMemberRole, GuestInvitationStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  CheckInUnauthorizedError,
  EventNotFoundError,
  InvalidCheckInGuestError,
} from "@/lib/checkin/errors";
import {
  confirmManualCheckIn,
  confirmQrCheckIn,
  getCheckInDashboardData,
  previewManualCheckIn,
  previewQrCheckIn,
  searchGuestsForCheckIn,
} from "@/lib/checkin/service";

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
      id: `test-checkin-${label}-${randomUUID()}`,
      email: `test-checkin-${label}-${randomUUID()}@example.invalid`,
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
      title: "Pernikahan Check-in Uji Coba",
      slug: `test-checkin-slug-${randomUUID()}`,
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

function scannedValueFor(token: string) {
  return `https://example.invalid/invite/some-slug?to=${token}`;
}

describe("previewQrCheckIn / previewManualCheckIn (integration — live Supabase DEV database)", () => {
  it("resolves the correct guest from a valid token, VIEWER-readable", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const { guest, token } = await createTestGuest(event.id, "Budi Santoso");

    const preview = await previewQrCheckIn(event.id, viewer.id, scannedValueFor(token));
    expect(preview.guestId).toBe(guest.id);
    expect(preview.guestName).toBe("Budi Santoso");
    expect(preview.isCheckedIn).toBe(false);
  });

  it("rejects a token belonging to a different event (cross-event IDOR)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const { token } = await createTestGuest(eventB.id);

    await expect(previewQrCheckIn(eventA.id, owner.id, scannedValueFor(token))).rejects.toThrow(
      InvalidCheckInGuestError,
    );
  });

  it("rejects an unknown/malformed token", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    await expect(
      previewQrCheckIn(event.id, owner.id, scannedValueFor(randomUUID().replace(/-/g, ""))),
    ).rejects.toThrow(InvalidCheckInGuestError);
    await expect(previewQrCheckIn(event.id, owner.id, "not a url at all")).rejects.toThrow(
      InvalidCheckInGuestError,
    );
  });

  it("rejects a guestId belonging to a different event (cross-event IDOR)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const { guest } = await createTestGuest(eventB.id);

    await expect(previewManualCheckIn(eventA.id, owner.id, guest.id)).rejects.toThrow(
      InvalidCheckInGuestError,
    );
  });

  it("rejects a caller with no relationship to the event", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);
    const { guest } = await createTestGuest(event.id);

    await expect(previewManualCheckIn(event.id, stranger.id, guest.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("shows RSVP status and does not block preview for a NOT_ATTENDING or no-response guest", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest: guestNoRsvp } = await createTestGuest(event.id, "Belum Merespons");
    const { guest: guestDeclined } = await createTestGuest(event.id, "Menolak Hadir");
    await prisma.rSVP.create({
      data: {
        eventId: event.id,
        guestId: guestDeclined.id,
        attendance: "NOT_ATTENDING",
        attendeeCount: 0,
        submittedAt: new Date(),
      },
    });

    const previewNoRsvp = await previewManualCheckIn(event.id, owner.id, guestNoRsvp.id);
    expect(previewNoRsvp.rsvpAttendance).toBeNull();

    const previewDeclined = await previewManualCheckIn(event.id, owner.id, guestDeclined.id);
    expect(previewDeclined.rsvpAttendance).toBe("NOT_ATTENDING");
  });
});

describe("confirmManualCheckIn / confirmQrCheckIn (integration — live Supabase DEV database)", () => {
  it("lets the OWNER check in a guest manually, storing MANUAL method and correct checkedInBy/checkedInAt", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest } = await createTestGuest(event.id);

    const before = new Date();
    const result = await confirmManualCheckIn(event.id, owner.id, guest.id);
    const after = new Date();

    expect(result.status).toBe("SUCCESS");
    expect(result.guest.isCheckedIn).toBe(true);

    const stored = await prisma.checkIn.findUniqueOrThrow({
      where: { eventId_guestId: { eventId: event.id, guestId: guest.id } },
    });
    expect(stored.method).toBe(CheckInMethod.MANUAL);
    expect(stored.checkedInBy).toBe(owner.id);
    expect(stored.checkedInAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(stored.checkedInAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("lets an EDITOR-role member check in a guest via QR, storing QR method", async () => {
    const owner = await createTestUser("owner");
    const editor = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, editor.id, EventMemberRole.EDITOR);
    const { guest, token } = await createTestGuest(event.id);

    const result = await confirmQrCheckIn(event.id, editor.id, scannedValueFor(token));

    expect(result.status).toBe("SUCCESS");
    const stored = await prisma.checkIn.findUniqueOrThrow({
      where: { eventId_guestId: { eventId: event.id, guestId: guest.id } },
    });
    expect(stored.method).toBe(CheckInMethod.QR);
    expect(stored.checkedInBy).toBe(editor.id);
  });

  it("rejects a VIEWER-role member attempting to check in, and never creates a row", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const { guest } = await createTestGuest(event.id);

    await expect(confirmManualCheckIn(event.id, viewer.id, guest.id)).rejects.toThrow(
      CheckInUnauthorizedError,
    );
    expect(await prisma.checkIn.count({ where: { eventId: event.id, guestId: guest.id } })).toBe(0);
  });

  it("rejects a caller with no relationship to the event (IDOR-safe: same error as nonexistent event)", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);
    const { guest } = await createTestGuest(event.id);

    await expect(confirmManualCheckIn(event.id, stranger.id, guest.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("does not block check-in for a NOT_ATTENDING RSVP or no RSVP at all", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest } = await createTestGuest(event.id, "Menolak Tapi Datang");
    await prisma.rSVP.create({
      data: {
        eventId: event.id,
        guestId: guest.id,
        attendance: "NOT_ATTENDING",
        attendeeCount: 0,
        submittedAt: new Date(),
      },
    });

    const result = await confirmManualCheckIn(event.id, owner.id, guest.id);
    expect(result.status).toBe("SUCCESS");
  });

  it("a second check-in attempt returns ALREADY_CHECKED_IN, and exactly one CheckIn row exists", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest } = await createTestGuest(event.id);

    const first = await confirmManualCheckIn(event.id, owner.id, guest.id);
    const second = await confirmManualCheckIn(event.id, owner.id, guest.id);

    expect(first.status).toBe("SUCCESS");
    expect(second.status).toBe("ALREADY_CHECKED_IN");
    expect(await prisma.checkIn.count({ where: { eventId: event.id, guestId: guest.id } })).toBe(1);
  });

  it(
    "genuinely concurrent check-in attempts on the same guest resolve to exactly one CheckIn row " +
      "and one honest ALREADY_CHECKED_IN loser (database unique constraint arbitrates, not check-then-act)",
    async () => {
      const owner = await createTestUser("owner");
      const event = await createTestEvent(owner.id);
      const { guest } = await createTestGuest(event.id);

      const [a, b] = await Promise.all([
        confirmManualCheckIn(event.id, owner.id, guest.id),
        confirmManualCheckIn(event.id, owner.id, guest.id),
      ]);

      const statuses = [a.status, b.status].sort();
      expect(statuses).toEqual(["ALREADY_CHECKED_IN", "SUCCESS"]);
      expect(await prisma.checkIn.count({ where: { eventId: event.id, guestId: guest.id } })).toBe(
        1,
      );
    },
  );

  it("synchronizes GuestInvitation.status to CHECKED_IN atomically on success", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest, invitation } = await createTestGuest(event.id);

    await confirmManualCheckIn(event.id, owner.id, guest.id);

    const storedInvitation = await prisma.guestInvitation.findUniqueOrThrow({
      where: { id: invitation.id },
    });
    expect(storedInvitation.status).toBe(GuestInvitationStatus.CHECKED_IN);
  });

  it("a duplicate/concurrent loser does not re-mutate GuestInvitation.status", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest, invitation } = await createTestGuest(event.id);

    await confirmManualCheckIn(event.id, owner.id, guest.id);
    const afterFirst = await prisma.guestInvitation.findUniqueOrThrow({
      where: { id: invitation.id },
    });
    expect(afterFirst.status).toBe(GuestInvitationStatus.CHECKED_IN);
    const updatedAtAfterFirst = afterFirst.updatedAt.getTime();

    const second = await confirmManualCheckIn(event.id, owner.id, guest.id);
    expect(second.status).toBe("ALREADY_CHECKED_IN");

    const afterSecond = await prisma.guestInvitation.findUniqueOrThrow({
      where: { id: invitation.id },
    });
    expect(afterSecond.status).toBe(GuestInvitationStatus.CHECKED_IN);
    expect(afterSecond.updatedAt.getTime()).toBe(updatedAtAfterFirst);
  });

  it("rejects an unknown/malformed QR token without creating a row", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    await expect(
      confirmQrCheckIn(event.id, owner.id, scannedValueFor(randomUUID().replace(/-/g, ""))),
    ).rejects.toThrow(InvalidCheckInGuestError);
    expect(await prisma.checkIn.count({ where: { eventId: event.id } })).toBe(0);
  });

  it("rejects a QR token scoped to a different event without creating a row (cross-event IDOR)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const { token } = await createTestGuest(eventB.id);

    await expect(confirmQrCheckIn(eventA.id, owner.id, scannedValueFor(token))).rejects.toThrow(
      InvalidCheckInGuestError,
    );
    expect(await prisma.checkIn.count({ where: { eventId: eventA.id } })).toBe(0);
  });
});

describe("searchGuestsForCheckIn (integration — live Supabase DEV database)", () => {
  it("returns only guestId/guestName/category/isCheckedIn — no phone/email/notes/token", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await prisma.guest.create({
      data: {
        eventId: event.id,
        name: "Citra Dewi",
        normalizedName: "citra dewi",
        phone: "+6281234567890",
        email: "citra@example.invalid",
        notes: "Alergi kacang",
        seatQuota: 2,
      },
    });

    const results = await searchGuestsForCheckIn(event.id, owner.id, "Citra");
    expect(results).toHaveLength(1);
    expect(Object.keys(results[0]).sort()).toEqual(
      ["category", "guestId", "guestName", "isCheckedIn"].sort(),
    );
  });

  it("reflects check-in status in search results", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest } = await createTestGuest(event.id, "Dedi Pratama");
    await confirmManualCheckIn(event.id, owner.id, guest.id);

    const results = await searchGuestsForCheckIn(event.id, owner.id, "Dedi");
    expect(results).toHaveLength(1);
    expect(results[0].isCheckedIn).toBe(true);
  });

  it("never returns another event's guests", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    await createTestGuest(eventB.id, "Eka Wijaya");

    const results = await searchGuestsForCheckIn(eventA.id, owner.id, "Eka");
    expect(results).toEqual([]);
  });
});

describe("getCheckInDashboardData (integration — live Supabase DEV database)", () => {
  it("computes correct summary counts", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const { guest: attending } = await createTestGuest(event.id, "Fajar Nugroho");
    const { guest: declined } = await createTestGuest(event.id, "Gita Permata");
    await createTestGuest(event.id, "Hasan Ramli");

    await prisma.rSVP.create({
      data: {
        eventId: event.id,
        guestId: attending.id,
        attendance: "ATTENDING",
        attendeeCount: 2,
        submittedAt: new Date(),
      },
    });
    await prisma.rSVP.create({
      data: {
        eventId: event.id,
        guestId: declined.id,
        attendance: "NOT_ATTENDING",
        attendeeCount: 0,
        submittedAt: new Date(),
      },
    });
    await confirmManualCheckIn(event.id, owner.id, attending.id);

    const data = await getCheckInDashboardData(event.id, owner.id);
    expect(data.summary.totalInvited).toBe(3);
    expect(data.summary.confirmed).toBe(1);
    expect(data.summary.checkedIn).toBe(1);
    expect(data.summary.remaining).toBe(2);
    expect(data.role).toBe(EventMemberRole.OWNER);
  });

  it("rejects a caller with no relationship to the event", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(getCheckInDashboardData(event.id, stranger.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });
});
