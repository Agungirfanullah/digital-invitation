import { describe, expect, it } from "vitest";

import { buildPreviewInvitation, type PreviewSource } from "@/lib/editor/preview";

function baseSource(overrides: Partial<PreviewSource> = {}): PreviewSource {
  return {
    eventId: "event-1",
    slug: "uji-coba",
    type: "WEDDING",
    title: "Pernikahan Uji Coba",
    description: null,
    templateKey: null,
    weddingProfile: null,
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

  it("passes through the wedding profile unchanged", () => {
    const profile = {
      brideFullName: "Ayu",
      brideNickname: "Ayu",
      brideFather: null,
      brideMother: null,
      brideInstagram: null,
      groomFullName: "Budi",
      groomNickname: "Budi",
      groomFather: null,
      groomMother: null,
      groomInstagram: null,
    };
    const invitation = buildPreviewInvitation(baseSource({ weddingProfile: profile }));
    expect(invitation.weddingProfile).toEqual(profile);
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
