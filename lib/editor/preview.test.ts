import { describe, expect, it } from "vitest";
import type { EventType } from "@prisma/client";

import { buildPreviewInvitation, type PreviewSource } from "@/lib/editor/preview";
import { getTemplateDefaultTheme } from "@/lib/invitations/templates/default-themes";
import { buildPublicIdentity, emptyIdentityFor } from "@/lib/event-types/identity";
import { resolveEnabledSections } from "@/lib/event-types/sections";
import { IDENTITY_BY_TYPE } from "@/components/invitation/templates/test-fixtures";

function baseSource(overrides: Partial<PreviewSource> = {}): PreviewSource {
  return {
    eventId: "event-1",
    slug: "uji-coba",
    type: "WEDDING",
    title: "Pernikahan Uji Coba",
    description: null,
    templateKey: null,
    identity: emptyIdentityFor("WEDDING"),
    sectionOverrides: {},
    sectionOrder: null,
    openingEnabled: true,
    theme: null,
    schedules: [],
    loveStory: null,
    gallery: null,
    ...overrides,
  };
}

describe("buildPreviewInvitation", () => {
  it("maps core fields straight through", () => {
    const invitation = buildPreviewInvitation(baseSource());
    expect(invitation.eventId).toBe("event-1");
    expect(invitation.slug).toBe("uji-coba");
    expect(invitation.title).toBe("Pernikahan Uji Coba");
  });

  it("always has a null guest — the editor preview never has personalization", () => {
    const invitation = buildPreviewInvitation(baseSource());
    expect(invitation.guest).toBeNull();
  });

  it("applies the same default-theme fallback used in production when theme is null", () => {
    const invitation = buildPreviewInvitation(baseSource({ theme: null }));
    expect(invitation.theme.primaryColor).toBeTruthy();
    expect(invitation.theme.backgroundImageUrl).toBeNull();
  });

  it("falls back to the selected template's own default palette, like the public page", () => {
    const dark = buildPreviewInvitation(baseSource({ templateKey: "dark-luxury", theme: null }));
    const light = buildPreviewInvitation(
      baseSource({ templateKey: "minimal-elegant", theme: null }),
    );

    expect(dark.theme).toEqual(getTemplateDefaultTheme("dark-luxury"));
    expect(dark.theme.backgroundColor).not.toBe(light.theme.backgroundColor);
  });

  it("lets an explicit owner color win over the template default, field by field", () => {
    const invitation = buildPreviewInvitation(
      baseSource({
        templateKey: "dark-luxury",
        theme: {
          primaryColor: "#123456",
          secondaryColor: null,
          backgroundColor: null,
          textColor: null,
          accentColor: null,
          headingFont: null,
          bodyFont: null,
          scriptFont: null,
          backgroundImageUrl: null,
        },
      }),
    );

    expect(invitation.theme.primaryColor).toBe("#123456");
    expect(invitation.theme.backgroundColor).toBe(
      getTemplateDefaultTheme("dark-luxury").backgroundColor,
    );
  });

  it("passes through raw (unsaved) theme edits", () => {
    const invitation = buildPreviewInvitation(
      baseSource({
        theme: {
          primaryColor: "#123456",
          secondaryColor: null,
          backgroundColor: null,
          textColor: null,
          accentColor: null,
          headingFont: null,
          bodyFont: null,
          scriptFont: null,
          backgroundImageUrl: null,
        },
      }),
    );
    expect(invitation.theme.primaryColor).toBe("#123456");
  });

  it.each(Object.keys(IDENTITY_BY_TYPE) as EventType[])(
    "builds the %s identity through the same canonical transformation as the public projection",
    (type) => {
      const invitation = buildPreviewInvitation(
        baseSource({ type, identity: IDENTITY_BY_TYPE[type] }),
      );
      expect(invitation.identity).toEqual(buildPublicIdentity(type, IDENTITY_BY_TYPE[type]));
    },
  );

  it("never renders another family's unsaved identity under this type's terminology", () => {
    const invitation = buildPreviewInvitation(
      baseSource({ type: "BIRTHDAY", identity: IDENTITY_BY_TYPE.WEDDING }),
    );
    expect(invitation.identity).toBeNull();
  });

  it("applies unsaved section overrides with the same resolver and stripping as production", () => {
    const loveStory = {
      id: "story-1",
      title: null,
      items: [{ id: "i", dateLabel: null, title: "Momen", description: null, imageUrl: null }],
    };
    const invitation = buildPreviewInvitation(
      baseSource({ loveStory, sectionOverrides: { story: false, rsvp: false } }),
    );
    expect(invitation.sections).toEqual(
      resolveEnabledSections("WEDDING", { sections: { story: false, rsvp: false } }),
    );
    expect(invitation.sections.story).toBe(false);
    expect(invitation.loveStory).toBeNull();
  });

  it("passes through schedules unchanged", () => {
    const schedules = [
      {
        id: "sch-1",
        title: "Akad Nikah",
        description: null,
        date: "2026-12-12",
        startTime: "08:00",
        endTime: "10:00",
        venue: null,
      },
    ];
    const invitation = buildPreviewInvitation(baseSource({ schedules }));
    expect(invitation.schedules).toEqual(schedules);
  });

  it("wraps a single gallery into the galleries array expected by the renderer", () => {
    const gallery = {
      id: "gal-1",
      title: "Galeri",
      items: [
        {
          id: "item-1",
          type: "IMAGE" as const,
          url: "https://example.com/a.jpg",
          thumbnailUrl: null,
          caption: null,
        },
      ],
    };
    const invitation = buildPreviewInvitation(baseSource({ gallery }));
    expect(invitation.galleries).toHaveLength(1);
    expect(invitation.galleries[0].items[0].url).toBe("https://example.com/a.jpg");
  });

  it("produces an empty galleries array when there is no gallery yet", () => {
    const invitation = buildPreviewInvitation(baseSource({ gallery: null }));
    expect(invitation.galleries).toEqual([]);
  });

  it("does not crash when everything optional is null/empty", () => {
    expect(() => buildPreviewInvitation(baseSource())).not.toThrow();
  });
});
