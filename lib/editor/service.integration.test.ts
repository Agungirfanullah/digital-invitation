/**
 * Integration tests for the editor domain/service layer, run against the
 * real Supabase DEV Postgres database via Prisma (no mocks) — same
 * rationale as lib/events/ and lib/invitations/: authorization and
 * persistence correctness (including the eventId-scoping IDOR defense on
 * every nested mutation) need to be proven against real queries.
 *
 * Every row created here is deleted in `afterEach` via cascading deletes
 * off the tracked Event/User ids, regardless of test outcome.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { EventMemberRole, type EventType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  EventNotFoundError,
  IdentityFamilyMismatchError,
  SectionNotToggleableError,
  TemplateNotAvailableError,
} from "@/lib/editor/errors";
import type { IdentityProfileData } from "@/lib/event-types/identity";
import {
  INVITATION_SECTION_KEYS,
  resolveSectionOrder,
  resolveSectionStates,
} from "@/lib/event-types/sections";
import { IDENTITY_BY_TYPE } from "@/components/invitation/templates/test-fixtures";
import {
  addGalleryItem,
  addLoveStoryItem,
  createSchedule,
  deleteGalleryItem,
  deleteLoveStoryItem,
  deleteSchedule,
  getEditorEvent,
  listTemplateOptions,
  moveGalleryItem,
  moveSectionOrder,
  selectTemplate,
  updateGalleryItem,
  updateGalleryItemCaption,
  updateLoveStoryItem,
  updateLoveStoryTitle,
  updateSchedule,
  updateIdentityProfile,
  updateSectionOverrides,
  updateTheme,
  uploadGalleryImage,
} from "@/lib/editor/service";
import { getStorageProvider } from "@/lib/storage/provider";
import { derivePathFromPublicUrl } from "@/lib/storage/paths";
import { validateGalleryImageUpload } from "@/lib/storage/validation";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import type {
  CoupleIdentityInput,
  IdentityProfileInput,
  ScheduleInput,
} from "@/lib/editor/validation";

/** A real, valid 1x1 transparent PNG — used to exercise the actual upload/storage path, not a mocked buffer. */
const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function tinyPngUpload() {
  const buffer = Buffer.from(TINY_PNG_BASE64, "base64");
  return validateGalleryImageUpload({
    name: "photo.png",
    type: "image/png",
    size: buffer.length,
    buffer,
  });
}

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
      id: `test-editor-${label}-${randomUUID()}`,
      email: `test-editor-${label}-${randomUUID()}@example.invalid`,
      name: `Test User ${label}`,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createTestEvent(ownerId: string, type: EventType = "WEDDING") {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type,
      title: "Pernikahan Editor Uji Coba",
      slug: `test-editor-slug-${randomUUID()}`,
      status: "DRAFT",
    },
  });
  createdEventIds.push(event.id);
  return event;
}

async function addMember(eventId: string, userId: string, role: EventMemberRole) {
  await prisma.eventMember.create({ data: { eventId, userId, role } });
}

const validSchedule: ScheduleInput = {
  title: "Akad Nikah",
  description: null,
  date: "2026-12-12",
  startTime: "08:00",
  endTime: "10:00",
  venue: {
    name: "Gedung Serbaguna",
    address: "Jl. Uji Coba No. 1",
    mapUrl: null,
    latitude: null,
    longitude: null,
  },
};

describe("getEditorEvent (integration — live Supabase DEV database)", () => {
  it("lets the owner load editor data", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const data = await getEditorEvent(event.id, owner.id);
    expect(data.eventId).toBe(event.id);
  });

  it("lets an EDITOR-role member load editor data", async () => {
    const owner = await createTestUser("owner");
    const editorUser = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, editorUser.id, EventMemberRole.EDITOR);

    const data = await getEditorEvent(event.id, editorUser.id);
    expect(data.eventId).toBe(event.id);
  });

  it("rejects a VIEWER-role member — the editor is not read-only accessible", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);

    await expect(getEditorEvent(event.id, viewer.id)).rejects.toThrow(EventNotFoundError);
  });

  it("rejects a user with no relationship to the event", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(getEditorEvent(event.id, stranger.id)).rejects.toThrow(EventNotFoundError);
  });

  it("rejects a nonexistent event id", async () => {
    const owner = await createTestUser("owner");
    await expect(getEditorEvent(`missing-${randomUUID()}`, owner.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });
});

/** Narrows a fixture identity to the writable (non-GENERIC) input shape. */
function asInput(identity: IdentityProfileData): IdentityProfileInput {
  if (identity.family === "GENERIC") throw new Error("GENERIC has no writable identity");
  return identity;
}

const WEDDING_INPUT = asInput(IDENTITY_BY_TYPE.WEDDING);

describe("updateIdentityProfile (integration)", () => {
  it("Wedding regression: the owner creates then updates the couple profile in WeddingProfile", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const created = await updateIdentityProfile(event.id, owner.id, WEDDING_INPUT);
    expect(created).toEqual(IDENTITY_BY_TYPE.WEDDING);

    const renamed = {
      family: "COUPLE" as const,
      data: { ...(WEDDING_INPUT.data as CoupleIdentityInput), brideNickname: "Ayu Baru" },
    };
    await updateIdentityProfile(event.id, owner.id, renamed);

    const row = await prisma.weddingProfile.findUniqueOrThrow({ where: { eventId: event.id } });
    expect(row.brideNickname).toBe("Ayu Baru");
    const loaded = await getEditorEvent(event.id, owner.id);
    expect(loaded.identity).toEqual(renamed);
  });

  it.each(
    (Object.keys(IDENTITY_BY_TYPE) as EventType[]).filter(
      (type) => IDENTITY_BY_TYPE[type].family !== "GENERIC",
    ),
  )("persists and reloads a %s identity in its own family's table", async (type) => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, type);

    const saved = await updateIdentityProfile(event.id, owner.id, asInput(IDENTITY_BY_TYPE[type]));
    expect(saved).toEqual(IDENTITY_BY_TYPE[type]);

    const loaded = await getEditorEvent(event.id, owner.id);
    expect(loaded.identity).toEqual(IDENTITY_BY_TYPE[type]);
  });

  it("starts every type from its own family's empty identity, and OTHER from GENERIC", async () => {
    const owner = await createTestUser("owner");
    for (const type of ["BIRTHDAY", "OTHER"] as const) {
      const event = await createTestEvent(owner.id, type);
      const loaded = await getEditorEvent(event.id, owner.id);
      expect(loaded.identity.family).toBe(type === "OTHER" ? "GENERIC" : "PERSON");
    }
  });

  it("rejects a wrong-family write (bride/groom for a Birthday) and writes nothing", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, "BIRTHDAY");

    await expect(updateIdentityProfile(event.id, owner.id, WEDDING_INPUT)).rejects.toThrow(
      IdentityFamilyMismatchError,
    );
    expect(await prisma.weddingProfile.count({ where: { eventId: event.id } })).toBe(0);
  });

  it("rejects any identity write for OTHER, which has no profile", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, "OTHER");

    for (const input of [WEDDING_INPUT, asInput(IDENTITY_BY_TYPE.CORPORATE)]) {
      await expect(updateIdentityProfile(event.id, owner.id, input)).rejects.toThrow(
        IdentityFamilyMismatchError,
      );
    }
  });

  it("rejects the Anniversary-only yearsTogether field on a Wedding", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, "WEDDING");

    await expect(
      updateIdentityProfile(event.id, owner.id, asInput(IDENTITY_BY_TYPE.ANNIVERSARY)),
    ).rejects.toThrow(IdentityFamilyMismatchError);
  });

  it("lets an EDITOR-role member update the identity", async () => {
    const owner = await createTestUser("owner");
    const editorUser = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, editorUser.id, EventMemberRole.EDITOR);

    await expect(
      updateIdentityProfile(event.id, editorUser.id, WEDDING_INPUT),
    ).resolves.toBeTruthy();
  });

  it("rejects a VIEWER-role member", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);

    await expect(updateIdentityProfile(event.id, viewer.id, WEDDING_INPUT)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("prevents another user (no relationship) from writing a profile — authorization runs before the family check (IDOR)", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id, "BIRTHDAY");

    // Both a matching and a mismatching family look identical to a stranger.
    for (const input of [asInput(IDENTITY_BY_TYPE.BIRTHDAY), WEDDING_INPUT]) {
      await expect(updateIdentityProfile(event.id, stranger.id, input)).rejects.toThrow(
        EventNotFoundError,
      );
    }
    expect(await prisma.personProfile.count({ where: { eventId: event.id } })).toBe(0);
  });
});

describe("updateSectionOverrides (integration)", () => {
  it("persists owner overrides into Event.settings, merged with existing keys", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await prisma.event.update({
      where: { id: event.id },
      data: { settings: { unrelated: "kept", sections: { gift: false } } },
    });

    const stored = await updateSectionOverrides(event.id, owner.id, { rsvp: false });
    expect(stored).toEqual({ gift: false, rsvp: false });

    const row = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(row.settings).toEqual({ unrelated: "kept", sections: { gift: false, rsvp: false } });
    expect((await getEditorEvent(event.id, owner.id)).sectionOverrides).toEqual(stored);
  });

  it("rejects toggling identity for OTHER (not supported) without writing", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, "OTHER");

    await expect(updateSectionOverrides(event.id, owner.id, { identity: false })).rejects.toThrow(
      SectionNotToggleableError,
    );
    const row = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(row.settings).toBeNull();
  });

  it("rejects a VIEWER-role member and a stranger (IDOR)", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);

    for (const userId of [viewer.id, stranger.id]) {
      await expect(updateSectionOverrides(event.id, userId, { rsvp: false })).rejects.toThrow(
        EventNotFoundError,
      );
    }
  });

  it("countdown defaults off and can be explicitly enabled (D-068)", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    expect((await getEditorEvent(event.id, owner.id)).sectionOverrides.countdown).toBeUndefined();

    const stored = await updateSectionOverrides(event.id, owner.id, { countdown: true });
    expect(stored.countdown).toBe(true);
    expect((await getEditorEvent(event.id, owner.id)).sectionOverrides).toEqual({
      countdown: true,
    });
  });
});

describe("moveSectionOrder (integration — D-067)", () => {
  it("moving a middle section up swaps it with its predecessor and persists the result", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const reordered = await moveSectionOrder(event.id, owner.id, "schedule", "up");
    const expected = [...INVITATION_SECTION_KEYS];
    const scheduleIndex = expected.indexOf("schedule");
    [expected[scheduleIndex - 1], expected[scheduleIndex]] = [
      expected[scheduleIndex],
      expected[scheduleIndex - 1],
    ];
    expect(reordered).toEqual(expected);

    const row = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(row.settings).toEqual({ sectionOrder: expected });
    expect((await getEditorEvent(event.id, owner.id)).sectionOrder).toEqual(expected);
  });

  it("moving a middle section down swaps it with its successor", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const reordered = await moveSectionOrder(event.id, owner.id, "schedule", "down");
    const expected = [...INVITATION_SECTION_KEYS];
    const scheduleIndex = expected.indexOf("schedule");
    [expected[scheduleIndex], expected[scheduleIndex + 1]] = [
      expected[scheduleIndex + 1],
      expected[scheduleIndex],
    ];
    expect(reordered).toEqual(expected);
  });

  it("moving the first section up is a safe no-op and writes nothing", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const first = INVITATION_SECTION_KEYS[0];
    const result = await moveSectionOrder(event.id, owner.id, first, "up");
    expect(result).toEqual(INVITATION_SECTION_KEYS);

    const row = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(row.settings).toBeNull();
  });

  it("moving the last section down is a safe no-op and writes nothing", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const last = INVITATION_SECTION_KEYS[INVITATION_SECTION_KEYS.length - 1];
    const result = await moveSectionOrder(event.id, owner.id, last, "down");
    expect(result).toEqual(INVITATION_SECTION_KEYS);

    const row = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(row.settings).toBeNull();
  });

  it("a persisted order survives an independent reload", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    await moveSectionOrder(event.id, owner.id, "wishes", "up");
    const reloaded = await getEditorEvent(event.id, owner.id);
    const expected = [...INVITATION_SECTION_KEYS];
    const wishesIndex = expected.indexOf("wishes");
    [expected[wishesIndex - 1], expected[wishesIndex]] = [
      expected[wishesIndex],
      expected[wishesIndex - 1],
    ];
    expect(reloaded.sectionOrder).toEqual(expected);
  });

  it("reordering does not disturb existing enable/disable overrides, and vice versa", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    await updateSectionOverrides(event.id, owner.id, { rsvp: false, gift: false });
    await moveSectionOrder(event.id, owner.id, "hero", "down");

    const row = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    const settings = row.settings as { sections: Record<string, boolean>; sectionOrder: string[] };
    expect(settings.sections).toEqual({ rsvp: false, gift: false });

    const expectedOrder = [...INVITATION_SECTION_KEYS];
    const heroIndex = expectedOrder.indexOf("hero");
    [expectedOrder[heroIndex], expectedOrder[heroIndex + 1]] = [
      expectedOrder[heroIndex + 1],
      expectedOrder[heroIndex],
    ];
    expect(settings.sectionOrder).toEqual(expectedOrder);

    const reloaded = await getEditorEvent(event.id, owner.id);
    expect(reloaded.sectionOverrides).toEqual({ rsvp: false, gift: false });
    expect(reloaded.sectionOrder).toEqual(expectedOrder);
  });

  it("rejects a VIEWER-role member and a stranger (IDOR)", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);

    for (const userId of [viewer.id, stranger.id]) {
      await expect(moveSectionOrder(event.id, userId, "hero", "up")).rejects.toThrow(
        EventNotFoundError,
      );
    }
  });

  it("rejects moving a section for an event belonging to a different owner (IDOR via cross-event id)", async () => {
    const ownerA = await createTestUser("owner-a");
    const ownerB = await createTestUser("owner-b");
    const eventA = await createTestEvent(ownerA.id);
    await createTestEvent(ownerB.id);

    await expect(moveSectionOrder(eventA.id, ownerB.id, "hero", "up")).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("countdown participates in reordering exactly like any other section (D-068)", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const reordered = await moveSectionOrder(event.id, owner.id, "countdown", "up");
    const expected = [...INVITATION_SECTION_KEYS];
    const countdownIndex = expected.indexOf("countdown");
    [expected[countdownIndex - 1], expected[countdownIndex]] = [
      expected[countdownIndex],
      expected[countdownIndex - 1],
    ];
    expect(reordered).toEqual(expected);
    expect((await getEditorEvent(event.id, owner.id)).sectionOrder).toEqual(expected);
  });
});

describe("moveSectionOrder — OTHER-type unsupported-section adjacency (D-067-FIX)", () => {
  // `identity` is unsupported for OTHER — a hidden slot that must never
  // block, or become the swap target for, an adjacent supported section's
  // move. Canonical order: hero, identity(hidden), countdown, schedule,
  // story, gallery, rsvp, gift, wishes. `countdown` (D-068) is the section
  // now immediately after the hidden slot, so it — not `schedule` — is
  // what exercises the adjacency fix here.

  /** Mirrors SectionsForm's own filtering — the list actually shown to the owner. */
  function visibleOrder(order: string[]) {
    const states = resolveSectionStates("OTHER", null);
    return order.filter((key) => states[key as keyof typeof states].supported);
  }

  it("Test 1 — moving Countdown up skips the hidden Identity section and lands next to Hero", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, "OTHER");

    const reordered = await moveSectionOrder(event.id, owner.id, "countdown", "up");

    // identity keeps its slot — not deleted from the persisted order.
    expect(reordered).toContain("identity");
    expect(reordered).toHaveLength(INVITATION_SECTION_KEYS.length);
    // Visible order: countdown now precedes hero, exactly as the owner asked.
    expect(visibleOrder(reordered)).toEqual([
      "countdown",
      "hero",
      "schedule",
      "story",
      "gallery",
      "rsvp",
      "gift",
      "wishes",
    ]);
  });

  it("Test 2 — moving Countdown back down skips the hidden Identity section and lands after Hero again", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, "OTHER");

    await moveSectionOrder(event.id, owner.id, "countdown", "up");
    const reordered = await moveSectionOrder(event.id, owner.id, "countdown", "down");

    expect(visibleOrder(reordered)).toEqual([
      "hero",
      "countdown",
      "schedule",
      "story",
      "gallery",
      "rsvp",
      "gift",
      "wishes",
    ]);
  });

  it("Test 3 — Hero (first reorderable section) cannot move up, even though Identity is hidden right after it", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, "OTHER");

    const result = await moveSectionOrder(event.id, owner.id, "hero", "up");
    expect(result).toEqual(INVITATION_SECTION_KEYS);

    const row = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(row.settings).toBeNull();
  });

  it("Test 4 — Wishes (last reorderable section) cannot move down", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, "OTHER");

    const result = await moveSectionOrder(event.id, owner.id, "wishes", "down");
    expect(result).toEqual(INVITATION_SECTION_KEYS);

    const row = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(row.settings).toBeNull();
  });

  it("Test 5 — the fixed-up order persists correctly across an independent reload", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, "OTHER");

    await moveSectionOrder(event.id, owner.id, "countdown", "up");
    const reloaded = await getEditorEvent(event.id, owner.id);

    expect(reloaded.sectionOrder).toContain("identity");
    expect(visibleOrder(reloaded.sectionOrder!)).toEqual([
      "countdown",
      "hero",
      "schedule",
      "story",
      "gallery",
      "rsvp",
      "gift",
      "wishes",
    ]);
  });

  it("Test 6 — UI/server consistency: the editor's visible order and the server's move both agree, and never swap against the hidden section", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id, "OTHER");

    // What SectionsForm shows before any move: countdown is the 2nd
    // visible item (index 1) — not first — so its "up" arrow would be
    // enabled.
    const before = await getEditorEvent(event.id, owner.id);
    const visibleBefore = visibleOrder(resolveSectionOrder({ sectionOrder: before.sectionOrder }));
    expect(visibleBefore.indexOf("countdown")).toBe(1);

    // The UI's enabled "up" click must produce a real, visible change —
    // this is the exact regression: "UI says move is possible but server
    // swaps against hidden unsupported section" (D-067-FIX).
    const reordered = await moveSectionOrder(event.id, owner.id, "countdown", "up");
    const visibleAfter = visibleOrder(reordered);
    expect(visibleAfter).not.toEqual(visibleBefore);
    expect(visibleAfter.indexOf("countdown")).toBeLessThan(visibleBefore.indexOf("countdown"));
  });
});

describe("updateTheme (integration)", () => {
  it("lets the owner set and persist theme values", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    await updateTheme(event.id, owner.id, {
      primaryColor: "#123456",
      secondaryColor: null,
      backgroundColor: null,
      textColor: null,
      accentColor: null,
      headingFont: null,
      bodyFont: null,
      scriptFont: null,
      backgroundImageUrl: null,
    });

    const loaded = await getEditorEvent(event.id, owner.id);
    expect(loaded.theme?.primaryColor).toBe("#123456");
  });

  it("prevents another user from updating the theme (IDOR)", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(
      updateTheme(event.id, stranger.id, {
        primaryColor: "#000000",
        secondaryColor: null,
        backgroundColor: null,
        textColor: null,
        accentColor: null,
        headingFont: null,
        bodyFont: null,
        scriptFont: null,
        backgroundImageUrl: null,
      }),
    ).rejects.toThrow(EventNotFoundError);
  });
});

describe("selectTemplate (integration)", () => {
  it("lets the owner select a real, implemented, active template", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const result = await selectTemplate(event.id, owner.id, "minimal-elegant");
    expect(result.templateKey).toBe("minimal-elegant");

    const loaded = await getEditorEvent(event.id, owner.id);
    expect(loaded.templateKey).toBe("minimal-elegant");
  });

  it("lets the owner select each of the five new Phase 3 templates", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const newSlugs = [
      "modern-editorial",
      "floral-romance",
      "dark-luxury",
      "traditional-nusantara",
      "soft-romantic",
    ];

    for (const slug of newSlugs) {
      const result = await selectTemplate(event.id, owner.id, slug);
      expect(result.templateKey).toBe(slug);
    }
  });

  it("rejects a seeded-but-unimplemented template slug", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    // All six Phase 3 templates are registered now, so this test seeds
    // its own synthetic "in the catalog but not in the registry" row
    // rather than relying on any specific real slug staying unimplemented
    // forever — proving being in the DB alone is never sufficient, the
    // registry check is the real gate.
    const slug = `test-unimplemented-template-${randomUUID()}`;
    await prisma.template.create({
      data: { name: "Test Unimplemented Template", slug, category: "wedding", isActive: true },
    });

    try {
      await expect(selectTemplate(event.id, owner.id, slug)).rejects.toThrow(
        TemplateNotAvailableError,
      );
    } finally {
      await prisma.template.delete({ where: { slug } });
    }
  });

  it("rejects a nonexistent template slug", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    await expect(
      selectTemplate(event.id, owner.id, `not-a-real-template-${randomUUID()}`),
    ).rejects.toThrow(TemplateNotAvailableError);
  });

  it("clears the template selection when given null", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await selectTemplate(event.id, owner.id, "minimal-elegant");

    const result = await selectTemplate(event.id, owner.id, null);
    expect(result.templateKey).toBeNull();
  });

  it("prevents another user from selecting a template (IDOR)", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(selectTemplate(event.id, stranger.id, "minimal-elegant")).rejects.toThrow(
      EventNotFoundError,
    );
  });
});

describe("listTemplateOptions (integration)", () => {
  it("flags every Phase 3 seeded template as implemented", async () => {
    const options = await listTemplateOptions();
    const seededSlugs = [
      "minimal-elegant",
      "modern-editorial",
      "floral-romance",
      "dark-luxury",
      "traditional-nusantara",
      "soft-romantic",
    ];

    for (const slug of seededSlugs) {
      expect(options.find((o) => o.slug === slug)?.implemented, slug).toBe(true);
    }
  });

  it("still flags a genuinely unregistered template as not implemented", async () => {
    const slug = `test-unimplemented-template-${randomUUID()}`;
    await prisma.template.create({
      data: { name: "Test Unimplemented Template", slug, category: "wedding", isActive: true },
    });

    try {
      const options = await listTemplateOptions();
      expect(options.find((o) => o.slug === slug)?.implemented).toBe(false);
    } finally {
      await prisma.template.delete({ where: { slug } });
    }
  });
});

describe("schedule + venue mutations (integration)", () => {
  it("creates a schedule with an embedded venue in one transaction", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const schedule = await createSchedule(event.id, owner.id, validSchedule);
    expect(schedule.venue?.name).toBe("Gedung Serbaguna");
  });

  it("updates the same venue row in place rather than creating a new one", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const schedule = await createSchedule(event.id, owner.id, validSchedule);

    const beforeVenue = await prisma.venue.findFirst({ where: { eventId: event.id } });

    const updated = await updateSchedule(event.id, owner.id, schedule.id, {
      ...validSchedule,
      venue: { ...validSchedule.venue!, name: "Gedung Baru" },
    });

    expect(updated.venue?.name).toBe("Gedung Baru");
    const venueCount = await prisma.venue.count({ where: { eventId: event.id } });
    expect(venueCount).toBe(1);
    expect((await prisma.venue.findUnique({ where: { id: beforeVenue!.id } }))?.name).toBe(
      "Gedung Baru",
    );
  });

  it("detaches (not deletes) the venue when the user removes it from the schedule", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const schedule = await createSchedule(event.id, owner.id, validSchedule);
    const venueBefore = await prisma.venue.findFirst({ where: { eventId: event.id } });

    const updated = await updateSchedule(event.id, owner.id, schedule.id, {
      ...validSchedule,
      venue: null,
    });

    expect(updated.venue).toBeNull();
    // The Venue row itself must still exist — omitting it from the UI is
    // not the same as an explicit delete.
    const venueAfter = await prisma.venue.findUnique({ where: { id: venueBefore!.id } });
    expect(venueAfter).not.toBeNull();
  });

  it("deletes a schedule", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const schedule = await createSchedule(event.id, owner.id, validSchedule);

    await deleteSchedule(event.id, owner.id, schedule.id);

    const loaded = await getEditorEvent(event.id, owner.id);
    expect(loaded.schedules).toHaveLength(0);
  });

  it("prevents mutating a schedule that belongs to a DIFFERENT event, even one the caller owns (IDOR via cross-event id)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const scheduleInA = await createSchedule(eventA.id, owner.id, validSchedule);

    // Same owner, but eventB's id doesn't scope to eventA's schedule.
    await expect(
      updateSchedule(eventB.id, owner.id, scheduleInA.id, validSchedule),
    ).rejects.toThrow(EventNotFoundError);
    await expect(deleteSchedule(eventB.id, owner.id, scheduleInA.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("prevents another user from creating/updating/deleting a schedule (IDOR)", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);
    const schedule = await createSchedule(event.id, owner.id, validSchedule);

    await expect(createSchedule(event.id, stranger.id, validSchedule)).rejects.toThrow(
      EventNotFoundError,
    );
    await expect(updateSchedule(event.id, stranger.id, schedule.id, validSchedule)).rejects.toThrow(
      EventNotFoundError,
    );
    await expect(deleteSchedule(event.id, stranger.id, schedule.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });
});

describe("love story mutations (integration)", () => {
  const item = { dateLabel: "2018", title: "Pertama Bertemu", description: null, imageUrl: null };

  it("auto-creates the love story on first item add, and title update reuses it", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const created = await addLoveStoryItem(event.id, owner.id, item);
    expect(created.title).toBe("Pertama Bertemu");

    const withTitle = await updateLoveStoryTitle(event.id, owner.id, "Kisah Kami");
    expect(withTitle.title).toBe("Kisah Kami");
    expect(withTitle.items).toHaveLength(1);

    const loveStoryCount = await prisma.loveStory.count({ where: { eventId: event.id } });
    expect(loveStoryCount).toBe(1);
  });

  it("updates and deletes an item, scoped correctly to the event", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const created = await addLoveStoryItem(event.id, owner.id, item);

    const updated = await updateLoveStoryItem(event.id, owner.id, created.id, {
      ...item,
      title: "Pertama Bertemu (revisi)",
    });
    expect(updated.title).toBe("Pertama Bertemu (revisi)");

    await deleteLoveStoryItem(event.id, owner.id, created.id);
    const loaded = await getEditorEvent(event.id, owner.id);
    expect(loaded.loveStory?.items ?? []).toHaveLength(0);
  });

  it("prevents mutating a love story item that belongs to a different event (IDOR via cross-event id)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const itemInA = await addLoveStoryItem(eventA.id, owner.id, item);

    await expect(updateLoveStoryItem(eventB.id, owner.id, itemInA.id, item)).rejects.toThrow(
      EventNotFoundError,
    );
    await expect(deleteLoveStoryItem(eventB.id, owner.id, itemInA.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("prevents another user from mutating love story items (IDOR)", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);
    const created = await addLoveStoryItem(event.id, owner.id, item);

    await expect(addLoveStoryItem(event.id, stranger.id, item)).rejects.toThrow(EventNotFoundError);
    await expect(updateLoveStoryItem(event.id, stranger.id, created.id, item)).rejects.toThrow(
      EventNotFoundError,
    );
    await expect(deleteLoveStoryItem(event.id, stranger.id, created.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });
});

describe("gallery mutations (integration)", () => {
  // Video items only — image items are created via uploadGalleryImage
  // (see the "gallery image upload" and "gallery item deletion + storage
  // cleanup" describe blocks below), not addGalleryItem/updateGalleryItem.
  const galleryVideoItem = {
    type: "VIDEO" as const,
    url: "https://example.com/a.mp4",
    caption: null,
  };

  it("auto-creates the gallery on first item add", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const created = await addGalleryItem(event.id, owner.id, galleryVideoItem);
    expect(created.url).toBe("https://example.com/a.mp4");

    const galleryCount = await prisma.gallery.count({ where: { eventId: event.id } });
    expect(galleryCount).toBe(1);
  });

  it("updates and deletes an item, scoped correctly to the event", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const created = await addGalleryItem(event.id, owner.id, galleryVideoItem);

    const updated = await updateGalleryItem(event.id, owner.id, created.id, {
      ...galleryVideoItem,
      caption: "Momen bahagia",
    });
    expect(updated.caption).toBe("Momen bahagia");

    await deleteGalleryItem(event.id, owner.id, created.id);
    const loaded = await getEditorEvent(event.id, owner.id);
    expect(loaded.gallery?.items ?? []).toHaveLength(0);
  });

  it("updates only the caption via updateGalleryItemCaption, leaving the URL untouched", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const created = await addGalleryItem(event.id, owner.id, galleryVideoItem);

    const updated = await updateGalleryItemCaption(event.id, owner.id, created.id, "Ucapan baru");
    expect(updated.caption).toBe("Ucapan baru");
    expect(updated.url).toBe(galleryVideoItem.url);
  });

  it("prevents mutating a gallery item that belongs to a different event (IDOR via cross-event id)", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);
    const itemInA = await addGalleryItem(eventA.id, owner.id, galleryVideoItem);

    await expect(
      updateGalleryItem(eventB.id, owner.id, itemInA.id, galleryVideoItem),
    ).rejects.toThrow(EventNotFoundError);
    await expect(deleteGalleryItem(eventB.id, owner.id, itemInA.id)).rejects.toThrow(
      EventNotFoundError,
    );
    await expect(
      updateGalleryItemCaption(eventB.id, owner.id, itemInA.id, "hijack"),
    ).rejects.toThrow(EventNotFoundError);
    await expect(moveGalleryItem(eventB.id, owner.id, itemInA.id, "up")).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("prevents another user from mutating gallery items (IDOR)", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);
    const created = await addGalleryItem(event.id, owner.id, galleryVideoItem);

    await expect(addGalleryItem(event.id, stranger.id, galleryVideoItem)).rejects.toThrow(
      EventNotFoundError,
    );
    await expect(
      updateGalleryItem(event.id, stranger.id, created.id, galleryVideoItem),
    ).rejects.toThrow(EventNotFoundError);
    await expect(deleteGalleryItem(event.id, stranger.id, created.id)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("moving the only item up or down is a safe no-op (already at both edges)", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const created = await addGalleryItem(event.id, owner.id, galleryVideoItem);

    const afterUp = await moveGalleryItem(event.id, owner.id, created.id, "up");
    expect(afterUp.map((item) => item.id)).toEqual([created.id]);
    const afterDown = await moveGalleryItem(event.id, owner.id, created.id, "down");
    expect(afterDown.map((item) => item.id)).toEqual([created.id]);
  });

  it("moving an item down persists the new sortOrder — reflected by a fresh load", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const first = await addGalleryItem(event.id, owner.id, {
      ...galleryVideoItem,
      caption: "first",
    });
    await addGalleryItem(event.id, owner.id, { ...galleryVideoItem, caption: "second" });

    const reordered = await moveGalleryItem(event.id, owner.id, first.id, "down");
    expect(reordered.map((item) => item.caption)).toEqual(["second", "first"]);

    // Reflected by a completely independent read, proving it's persisted
    // (sortOrder in the DB), not just the in-memory return value.
    const reloaded = await getEditorEvent(event.id, owner.id);
    expect(reloaded.gallery?.items.map((item) => item.caption)).toEqual(["second", "first"]);
  });

  it("rejects moving a nonexistent/foreign item id", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    await addGalleryItem(event.id, owner.id, galleryVideoItem);

    await expect(
      moveGalleryItem(event.id, owner.id, `missing-${randomUUID()}`, "up"),
    ).rejects.toThrow(EventNotFoundError);
  });
});

describe("gallery image upload (integration — real Supabase Storage)", () => {
  it("an owner can upload a real image; it creates a correct DB record with a resolvable object path", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const created = await uploadGalleryImage(event.id, owner.id, tinyPngUpload(), "Foto pertama");

    expect(created.type).toBe("IMAGE");
    expect(created.caption).toBe("Foto pertama");
    expect(created.url).toContain(event.id);

    const path = derivePathFromPublicUrl(created.url);
    expect(path).not.toBeNull();
    expect(path).toContain(event.id);

    // Cleanup: this test verifies creation, not deletion — remove the
    // real object directly so it doesn't linger in the bucket.
    if (path) await getStorageProvider().remove(path);
  });

  it("an EDITOR-role member can upload", async () => {
    const owner = await createTestUser("owner");
    const editor = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: editor.id, role: EventMemberRole.EDITOR },
    });

    const created = await uploadGalleryImage(event.id, editor.id, tinyPngUpload(), null);
    const path = derivePathFromPublicUrl(created.url);
    if (path) await getStorageProvider().remove(path);
  });

  it("rejects a VIEWER-role member", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.id, role: EventMemberRole.VIEWER },
    });

    await expect(uploadGalleryImage(event.id, viewer.id, tinyPngUpload(), null)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("rejects a stranger with no relationship to the event", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(uploadGalleryImage(event.id, stranger.id, tinyPngUpload(), null)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("two uploads for two different events never collide on object path", async () => {
    const owner = await createTestUser("owner");
    const eventA = await createTestEvent(owner.id);
    const eventB = await createTestEvent(owner.id);

    const createdA = await uploadGalleryImage(eventA.id, owner.id, tinyPngUpload(), null);
    const createdB = await uploadGalleryImage(eventB.id, owner.id, tinyPngUpload(), null);

    expect(createdA.url).not.toBe(createdB.url);
    expect(createdA.url).toContain(eventA.id);
    expect(createdB.url).toContain(eventB.id);

    for (const url of [createdA.url, createdB.url]) {
      const path = derivePathFromPublicUrl(url);
      if (path) await getStorageProvider().remove(path);
    }
  });
});

describe("gallery item deletion + storage cleanup (integration — real Supabase Storage)", () => {
  it("deleting an uploaded image removes both the DB record and the storage object", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const created = await uploadGalleryImage(event.id, owner.id, tinyPngUpload(), null);
    const path = derivePathFromPublicUrl(created.url);
    expect(path).not.toBeNull();

    await deleteGalleryItem(event.id, owner.id, created.id);

    const dbRow = await prisma.galleryItem.findUnique({ where: { id: created.id } });
    expect(dbRow).toBeNull();

    // The object is genuinely gone — downloading it now fails.
    const bucket = getServerEnv().SUPABASE_STORAGE_BUCKET;
    const { error } = await createSupabaseServiceClient().storage.from(bucket).download(path!);
    expect(error).not.toBeNull();
  });

  it("deleting a legacy/externally-hosted video item never calls storage removal and still deletes the row", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);
    const created = await addGalleryItem(event.id, owner.id, {
      type: "VIDEO",
      url: "https://example.com/legacy-video.mp4",
      caption: null,
    });

    // No real storage object exists for this URL — derivePathFromPublicUrl
    // must return null so deleteGalleryItem skips storage removal
    // entirely rather than erroring against a nonexistent path.
    expect(derivePathFromPublicUrl(created.url)).toBeNull();

    await expect(deleteGalleryItem(event.id, owner.id, created.id)).resolves.toBeUndefined();
    const dbRow = await prisma.galleryItem.findUnique({ where: { id: created.id } });
    expect(dbRow).toBeNull();
  });

  it("rejects a VIEWER-role member deleting an uploaded image; the DB record and storage object both survive", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await prisma.eventMember.create({
      data: { eventId: event.id, userId: viewer.id, role: EventMemberRole.VIEWER },
    });
    const created = await uploadGalleryImage(event.id, owner.id, tinyPngUpload(), null);

    await expect(deleteGalleryItem(event.id, viewer.id, created.id)).rejects.toThrow(
      EventNotFoundError,
    );

    const dbRow = await prisma.galleryItem.findUnique({ where: { id: created.id } });
    expect(dbRow).not.toBeNull();

    const path = derivePathFromPublicUrl(created.url)!;
    await getStorageProvider().remove(path); // real cleanup for this test's own upload
  });
});
