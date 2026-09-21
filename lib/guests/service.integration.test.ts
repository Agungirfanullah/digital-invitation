/**
 * Integration tests for the guest domain/service layer, run against the
 * real Supabase DEV Postgres database via Prisma (no mocks) — same
 * rationale as lib/events/, lib/invitations/, and lib/editor/: guest
 * authorization and the eventId-scoping IDOR defense need to be proven
 * against real queries, not a mocked Prisma client.
 *
 * Every row created here is deleted in `afterEach` via cascading deletes
 * off the tracked Event/User ids, regardless of test outcome.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { EventMemberRole, GuestCategory, GuestInvitationStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { EventNotFoundError, GuestNotFoundError } from "@/lib/guests/errors";
import {
  confirmGuestImport,
  createGuestForUser,
  deleteGuestForUser,
  exportGuestsToCsv,
  getGuestForEditor,
  getGuestInvitationDetail,
  getGuestPageData,
  previewGuestImport,
  regenerateGuestInvitationToken,
  updateGuestForUser,
} from "@/lib/guests/service";
import { guestListQuerySchema, type GuestInput } from "@/lib/guests/validation";

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
      id: `test-guests-${label}-${randomUUID()}`,
      email: `test-guests-${label}-${randomUUID()}@example.invalid`,
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
      title: "Pernikahan Tamu Uji Coba",
      slug: `test-guests-slug-${randomUUID()}`,
      status: "DRAFT",
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function addMember(eventId: string, userId: string, role: EventMemberRole) {
  await prisma.eventMember.create({ data: { eventId, userId, role } });
}

const defaultQuery = guestListQuerySchema.parse({});

const validGuest: GuestInput = {
  name: "Budi Santoso",
  phone: "0812-3456-7890",
  email: "budi@example.com",
  category: GuestCategory.FAMILY,
  seatQuota: 2,
  notes: null,
};

describe("createGuestForUser (integration — live Supabase DEV database)", () => {
  it("lets the owner create a guest with an auto-generated invitation token", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    expect(guest.name).toBe("Budi Santoso");
    expect(guest.invitationToken).not.toBeNull();
    const token = guest.invitationToken as string;
    expect(token.length).toBeGreaterThanOrEqual(10);
    expect(guest.invitationStatus).toBe("NOT_SENT");

    const invitation = await prisma.guestInvitation.findUnique({
      where: { token },
    });
    expect(invitation?.eventId).toBe(event.id);
    expect(invitation?.guestId).toBe(guest.id);
  });

  it("lets an EDITOR-role member create a guest", async () => {
    const owner = await createTestUser("owner");
    const editorUser = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, editorUser.id, EventMemberRole.EDITOR);

    const guest = await createGuestForUser(event.id, editorUser.id, validGuest);
    expect(guest.name).toBe("Budi Santoso");
  });

  it("rejects a VIEWER-role member", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);

    await expect(createGuestForUser(event.id, viewer.id, validGuest)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("rejects a user with no relationship to the event", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(createGuestForUser(event.id, stranger.id, validGuest)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("rejects a nonexistent event id", async () => {
    const owner = await createTestUser("owner");
    await expect(
      createGuestForUser(`missing-${randomUUID()}`, owner.id, validGuest),
    ).rejects.toThrow(EventNotFoundError);
  });

  it("two guests in different events can share the same name — no cross-event collision", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);

    const guestA = await createGuestForUser(eventA.id, owner.id, validGuest);
    const guestB = await createGuestForUser(eventB.id, owner.id, validGuest);

    expect(guestA.invitationToken).not.toBe(guestB.invitationToken);
  });
});

describe("updateGuestForUser / deleteGuestForUser — IDOR defense (integration)", () => {
  it("rejects updating a guest that belongs to a different event, even by that event's rightful owner", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const guestInA = await createGuestForUser(eventA.id, owner.id, validGuest);

    await expect(
      updateGuestForUser(eventB.id, owner.id, guestInA.id, { ...validGuest, name: "Hacked Name" }),
    ).rejects.toThrow(GuestNotFoundError);

    const stillIntact = await prisma.guest.findUnique({ where: { id: guestInA.id } });
    expect(stillIntact?.name).toBe("Budi Santoso");
  });

  it("rejects deleting a guest that belongs to a different event, even by that event's rightful owner", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const guestInA = await createGuestForUser(eventA.id, owner.id, validGuest);

    await expect(deleteGuestForUser(eventB.id, owner.id, guestInA.id)).rejects.toThrow(
      GuestNotFoundError,
    );

    const stillExists = await prisma.guest.findUnique({ where: { id: guestInA.id } });
    expect(stillExists).not.toBeNull();
  });

  it("rejects a VIEWER-role member updating a guest", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    await expect(
      updateGuestForUser(event.id, viewer.id, guest.id, { ...validGuest, name: "Renamed" }),
    ).rejects.toThrow(EventNotFoundError);
  });

  it("rejects a VIEWER-role member deleting a guest", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    await expect(deleteGuestForUser(event.id, viewer.id, guest.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("the owner can update then delete their own guest", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    const updated = await updateGuestForUser(event.id, owner.id, guest.id, {
      ...validGuest,
      name: "Budi Santoso Jr.",
    });
    expect(updated.name).toBe("Budi Santoso Jr.");

    await deleteGuestForUser(event.id, owner.id, guest.id);
    expect(await prisma.guest.findUnique({ where: { id: guest.id } })).toBeNull();
    expect(await prisma.guestInvitation.findFirst({ where: { guestId: guest.id } })).toBeNull();
  });

  it("rejects getGuestForEditor for a guest belonging to a different event", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const guestInA = await createGuestForUser(eventA.id, owner.id, validGuest);

    await expect(getGuestForEditor(eventB.id, owner.id, guestInA.id)).rejects.toThrow(
      GuestNotFoundError,
    );
  });
});

describe("getGuestPageData — read access and search/filter/sort/pagination (integration)", () => {
  it("allows VIEWER-role members to read the guest list (read-only)", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    await createGuestForUser(event.id, owner.id, validGuest);

    const page = await getGuestPageData(event.id, viewer.id, defaultQuery);
    expect(page.guests).toHaveLength(1);
    expect(page.role).toBe("VIEWER");
    // The bearer invitation token must never reach a VIEWER — masked at
    // the service layer, not merely hidden by the page's rendering choice.
    expect(page.guests[0].invitationToken).toBeNull();
  });

  it("includes the real invitation token for an EDITOR-role member", async () => {
    const owner = await createTestUser("owner");
    const editorUser = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, editorUser.id, EventMemberRole.EDITOR);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    const page = await getGuestPageData(event.id, editorUser.id, defaultQuery);
    expect(page.guests[0].invitationToken).toBe(guest.invitationToken);
  });

  it("includes the real invitation token for the owner", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    const page = await getGuestPageData(event.id, owner.id, defaultQuery);
    expect(page.guests[0].invitationToken).toBe(guest.invitationToken);
  });

  it("surfaces null rsvpAttendance for a guest who hasn't responded yet (Phase 8)", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await createGuestForUser(event.id, owner.id, validGuest);

    const page = await getGuestPageData(event.id, owner.id, defaultQuery);
    expect(page.guests[0].rsvpAttendance).toBeNull();
  });

  it("surfaces the real rsvpAttendance once the guest has responded (Phase 8)", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);
    await prisma.rSVP.create({
      data: { eventId: event.id, guestId: guest.id, attendance: "ATTENDING", attendeeCount: 2 },
    });

    const page = await getGuestPageData(event.id, owner.id, defaultQuery);
    expect(page.guests[0].rsvpAttendance).toBe("ATTENDING");
  });

  it("rejects a stranger reading the guest list", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(getGuestPageData(event.id, stranger.id, defaultQuery)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("never returns a guest from a different event", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    await createGuestForUser(eventA.id, owner.id, validGuest);

    const page = await getGuestPageData(eventB.id, owner.id, defaultQuery);
    expect(page.guests).toHaveLength(0);
  });

  it("filters by search query across name/phone/email", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await createGuestForUser(event.id, owner.id, { ...validGuest, name: "Ayu Lestari" });
    await createGuestForUser(event.id, owner.id, { ...validGuest, name: "Budi Santoso" });

    const page = await getGuestPageData(event.id, owner.id, { ...defaultQuery, q: "ayu" });
    expect(page.guests).toHaveLength(1);
    expect(page.guests[0].name).toBe("Ayu Lestari");
  });

  it("filters by category", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await createGuestForUser(event.id, owner.id, { ...validGuest, category: GuestCategory.VIP });
    await createGuestForUser(event.id, owner.id, { ...validGuest, category: GuestCategory.FRIEND });

    const page = await getGuestPageData(event.id, owner.id, {
      ...defaultQuery,
      category: GuestCategory.VIP,
    });
    expect(page.guests).toHaveLength(1);
    expect(page.guests[0].category).toBe("VIP");
  });

  it("sorts by name ascending", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await createGuestForUser(event.id, owner.id, { ...validGuest, name: "Zainal" });
    await createGuestForUser(event.id, owner.id, { ...validGuest, name: "Ayu" });

    const page = await getGuestPageData(event.id, owner.id, { ...defaultQuery, sort: "name_asc" });
    expect(page.guests.map((g) => g.name)).toEqual(["Ayu", "Zainal"]);
  });

  it("paginates results", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    for (let i = 0; i < 3; i += 1) {
      await createGuestForUser(event.id, owner.id, { ...validGuest, name: `Tamu ${i}` });
    }

    const page = await getGuestPageData(event.id, owner.id, {
      ...defaultQuery,
      page: 1,
      sort: "name_asc",
    });
    expect(page.total).toBe(3);
    expect(page.guests).toHaveLength(3);
  });
});

describe("CSV import (integration)", () => {
  const csvHeader = "nama,telepon,email,kategori,kuota,catatan";

  it("previews without writing anything to the database", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const preview = await previewGuestImport(
      event.id,
      owner.id,
      `${csvHeader}\nAyu Lestari,081234567890,ayu@example.com,Keluarga,2,`,
    );

    expect(preview.importableCount).toBe(1);
    expect(await prisma.guest.count({ where: { eventId: event.id } })).toBe(0);
  });

  it("confirm creates only the valid, non-duplicate rows", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await createGuestForUser(event.id, owner.id, { ...validGuest, name: "Ayu Lestari" });

    const csv = [
      csvHeader,
      "Ayu Lestari,,,,,", // duplicate of the existing guest (name match)
      "Citra Wulandari,089912345678,,Teman,1,", // valid
      ",,,,,", // invalid — no name
    ].join("\n");

    const summary = await confirmGuestImport(event.id, owner.id, csv);

    expect(summary.imported).toBe(1);
    expect(summary.skippedDuplicates).toBe(1);
    expect(summary.skippedInvalid).toBe(1);

    const guests = await prisma.guest.findMany({ where: { eventId: event.id } });
    expect(guests).toHaveLength(2); // the pre-existing Ayu + the newly imported Citra
    const citra = guests.find((g) => g.name === "Citra Wulandari");
    expect(citra?.category).toBe("FRIEND");

    // Every imported guest still got its own invitation token.
    const invitationCount = await prisma.guestInvitation.count({ where: { eventId: event.id } });
    expect(invitationCount).toBe(2);
  });

  it("detects duplicates within the same file, not just against the database", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const csv = [csvHeader, "Dewi Kartika,,,,,", "Dewi Kartika,,,,,"].join("\n");

    const preview = await previewGuestImport(event.id, owner.id, csv);
    expect(preview.importableCount).toBe(1);
    expect(preview.duplicateCount).toBe(1);
  });

  it("rejects a VIEWER-role member importing guests", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);

    await expect(previewGuestImport(event.id, viewer.id, `${csvHeader}\nAyu,,,,,`)).rejects.toThrow(
      EventNotFoundError,
    );
    await expect(confirmGuestImport(event.id, viewer.id, `${csvHeader}\nAyu,,,,,`)).rejects.toThrow(
      EventNotFoundError,
    );
  });
});

describe("exportGuestsToCsv (integration)", () => {
  it("exports guests as CSV without including invitation tokens", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    const { csv, filename } = await exportGuestsToCsv(event.id, owner.id);

    expect(csv).toContain("Budi Santoso");
    expect(csv).not.toContain(guest.invitationToken);
    expect(filename).toContain(event.slug);
  });

  it("allows a VIEWER-role member to export", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    await createGuestForUser(event.id, owner.id, validGuest);

    const { csv } = await exportGuestsToCsv(event.id, viewer.id);
    expect(csv).toContain("Budi Santoso");
  });

  it("rejects a stranger exporting", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(exportGuestsToCsv(event.id, stranger.id)).rejects.toThrow(EventNotFoundError);
  });
});

describe("getGuestInvitationDetail (integration)", () => {
  it("includes the real token for the owner", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    const detail = await getGuestInvitationDetail(event.id, owner.id, guest.id);
    expect(detail.invitationToken).toBe(guest.invitationToken);
    expect(detail.invitationTokenAvailable).toBe(true);
    expect(detail.role).toBe("OWNER");
  });

  it("includes the real token for an EDITOR-role member — the QR-code feature depends on this exact boundary (Roadmap Phase 13)", async () => {
    const owner = await createTestUser("owner");
    const editor = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, editor.id, EventMemberRole.EDITOR);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    const detail = await getGuestInvitationDetail(event.id, editor.id, guest.id);
    expect(detail.invitationToken).toBe(guest.invitationToken);
    expect(detail.invitationTokenAvailable).toBe(true);
    expect(detail.role).toBe("EDITOR");
  });

  it("masks the token for a VIEWER-role member but still reports it as available", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    const detail = await getGuestInvitationDetail(event.id, viewer.id, guest.id);
    expect(detail.invitationToken).toBeNull();
    expect(detail.invitationTokenAvailable).toBe(true);
    expect(detail.role).toBe("VIEWER");
  });

  it("rejects a stranger", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    await expect(getGuestInvitationDetail(event.id, stranger.id, guest.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("rejects a guest that belongs to a different event, even for that event's rightful owner", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const guestInA = await createGuestForUser(eventA.id, owner.id, validGuest);

    await expect(getGuestInvitationDetail(eventB.id, owner.id, guestInA.id)).rejects.toThrow(
      GuestNotFoundError,
    );
  });
});

describe("regenerateGuestInvitationToken (integration)", () => {
  it("issues a new token and the old one immediately stops resolving", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);
    const oldToken = guest.invitationToken as string;

    const result = await regenerateGuestInvitationToken(event.id, owner.id, guest.id);

    expect(result.invitationToken).not.toBe(oldToken);
    expect(await prisma.guestInvitation.findUnique({ where: { token: oldToken } })).toBeNull();
    expect(
      await prisma.guestInvitation.findUnique({ where: { token: result.invitationToken } }),
    ).not.toBeNull();
  });

  it("resets NOT_SENT/SENT/OPENED status back to NOT_SENT and clears timestamps", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);
    await prisma.guestInvitation.update({
      where: { token: guest.invitationToken as string },
      data: { status: GuestInvitationStatus.OPENED, sentAt: new Date(), openedAt: new Date() },
    });

    const result = await regenerateGuestInvitationToken(event.id, owner.id, guest.id);
    expect(result.invitationStatus).toBe(GuestInvitationStatus.NOT_SENT);

    const row = await prisma.guestInvitation.findUnique({
      where: { token: result.invitationToken },
    });
    expect(row?.sentAt).toBeNull();
    expect(row?.openedAt).toBeNull();
  });

  it("preserves RSVPED status — regenerating the token doesn't undo the guest's own action", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);
    await prisma.guestInvitation.update({
      where: { token: guest.invitationToken as string },
      data: { status: GuestInvitationStatus.RSVPED },
    });

    const result = await regenerateGuestInvitationToken(event.id, owner.id, guest.id);
    expect(result.invitationStatus).toBe(GuestInvitationStatus.RSVPED);
  });

  it("lets an EDITOR-role member regenerate", async () => {
    const owner = await createTestUser("owner");
    const editorUser = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, editorUser.id, EventMemberRole.EDITOR);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    await expect(
      regenerateGuestInvitationToken(event.id, editorUser.id, guest.id),
    ).resolves.toBeDefined();
  });

  it("rejects a VIEWER-role member", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);
    const guest = await createGuestForUser(event.id, owner.id, validGuest);

    await expect(regenerateGuestInvitationToken(event.id, viewer.id, guest.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("rejects a guest that belongs to a different event, even for that event's rightful owner (IDOR)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const guestInA = await createGuestForUser(eventA.id, owner.id, validGuest);

    await expect(regenerateGuestInvitationToken(eventB.id, owner.id, guestInA.id)).rejects.toThrow(
      GuestNotFoundError,
    );

    // The original token must still work — the cross-event attempt must not have mutated it.
    const stillIntact = await prisma.guestInvitation.findUnique({
      where: { token: guestInA.invitationToken as string },
    });
    expect(stillIntact).not.toBeNull();
  });
});
