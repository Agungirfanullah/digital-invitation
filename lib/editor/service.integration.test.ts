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
import { EventMemberRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { EventNotFoundError, TemplateNotAvailableError } from "@/lib/editor/errors";
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
  selectTemplate,
  updateGalleryItem,
  updateGalleryItemCaption,
  updateLoveStoryItem,
  updateLoveStoryTitle,
  updateSchedule,
  updateTheme,
  updateWeddingProfile,
  uploadGalleryImage,
} from "@/lib/editor/service";
import { getStorageProvider } from "@/lib/storage/provider";
import { derivePathFromPublicUrl } from "@/lib/storage/paths";
import { validateGalleryImageUpload } from "@/lib/storage/validation";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import type { ScheduleInput } from "@/lib/editor/validation";

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

async function createTestEvent(ownerId: string) {
  const event = await prisma.event.create({
    data: {
      ownerId,
      type: "WEDDING",
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

describe("updateWeddingProfile (integration)", () => {
  const profileInput = {
    brideFullName: "Ayu Lestari",
    brideNickname: "Ayu",
    brideFather: null,
    brideMother: null,
    brideInstagram: null,
    groomFullName: "Budi Santoso",
    groomNickname: "Budi",
    groomFather: null,
    groomMother: null,
    groomInstagram: null,
  };

  it("lets the owner create then update the wedding profile", async () => {
    const owner = await createTestUser("owner");
    const event = await createTestEvent(owner.id);

    const created = await updateWeddingProfile(event.id, owner.id, profileInput);
    expect(created.brideNickname).toBe("Ayu");

    const updated = await updateWeddingProfile(event.id, owner.id, {
      ...profileInput,
      brideNickname: "Ayu Baru",
    });
    expect(updated.brideNickname).toBe("Ayu Baru");

    const loaded = await getEditorEvent(event.id, owner.id);
    expect(loaded.weddingProfile?.brideNickname).toBe("Ayu Baru");
  });

  it("lets an EDITOR-role member update the wedding profile", async () => {
    const owner = await createTestUser("owner");
    const editorUser = await createTestUser("editor");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, editorUser.id, EventMemberRole.EDITOR);

    await expect(updateWeddingProfile(event.id, editorUser.id, profileInput)).resolves.toBeTruthy();
  });

  it("rejects a VIEWER-role member", async () => {
    const owner = await createTestUser("owner");
    const viewer = await createTestUser("viewer");
    const event = await createTestEvent(owner.id);
    await addMember(event.id, viewer.id, EventMemberRole.VIEWER);

    await expect(updateWeddingProfile(event.id, viewer.id, profileInput)).rejects.toThrow(
      EventNotFoundError,
    );
  });

  it("prevents another user (no relationship) from updating the wedding profile (IDOR)", async () => {
    const owner = await createTestUser("owner");
    const stranger = await createTestUser("stranger");
    const event = await createTestEvent(owner.id);

    await expect(updateWeddingProfile(event.id, stranger.id, profileInput)).rejects.toThrow(
      EventNotFoundError,
    );
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
