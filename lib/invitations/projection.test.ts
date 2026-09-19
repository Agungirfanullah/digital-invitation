import { describe, expect, it } from "vitest";

import { toPublicInvitation, type PublicEventRecord } from "@/lib/invitations/projection";

function fakeEvent(overrides: Partial<PublicEventRecord> = {}): PublicEventRecord {
  const base = {
    id: "event-1",
    ownerId: "user-1",
    type: "WEDDING",
    title: "Pernikahan Uji Coba",
    slug: "uji-coba",
    status: "PUBLISHED",
    description: "Deskripsi acara",
    templateId: null,
    publishedAt: new Date(),
    expiresAt: null,
    settings: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    template: null,
    theme: null,
    weddingProfile: null,
    schedules: [],
    loveStories: [],
    galleries: [],
    giftMethods: [],
  };

  return { ...base, ...overrides } as unknown as PublicEventRecord;
}

describe("toPublicInvitation", () => {
  it("maps core event fields", () => {
    const dto = toPublicInvitation(fakeEvent(), null);
    expect(dto.eventId).toBe("event-1");
    expect(dto.title).toBe("Pernikahan Uji Coba");
    expect(dto.slug).toBe("uji-coba");
  });

  it("never exposes owner/member/payment/subscription/audit fields, nor the ownerId value anywhere in the payload", () => {
    const dto = toPublicInvitation(fakeEvent(), null);

    expect(dto).not.toHaveProperty("ownerId");
    expect(dto).not.toHaveProperty("owner");
    expect(dto).not.toHaveProperty("members");
    expect(dto).not.toHaveProperty("payments");
    expect(dto).not.toHaveProperty("subscriptions");
    expect(dto).not.toHaveProperty("auditLogs");
    expect(JSON.stringify(dto)).not.toContain("user-1");
  });

  it("maps a template slug through as the raw templateKey", () => {
    const dto = toPublicInvitation(
      fakeEvent({ template: { slug: "minimal-elegant" } as never }),
      null,
    );
    expect(dto.templateKey).toBe("minimal-elegant");
  });

  it("defaults templateKey to null when there is no template", () => {
    const dto = toPublicInvitation(fakeEvent({ template: null }), null);
    expect(dto.templateKey).toBeNull();
  });

  it("includes the guest context only when provided", () => {
    const withGuest = toPublicInvitation(fakeEvent(), { displayName: "Budi" });
    expect(withGuest.guest).toEqual({ displayName: "Budi" });

    const withoutGuest = toPublicInvitation(fakeEvent(), null);
    expect(withoutGuest.guest).toBeNull();
  });

  it("never exposes a guest list — only ever the single resolved guest context", () => {
    const dto = toPublicInvitation(fakeEvent(), { displayName: "Budi" });
    expect(dto).not.toHaveProperty("guests");
    expect(dto).not.toHaveProperty("guestList");
  });

  it("maps schedules with their nested venue", () => {
    const dto = toPublicInvitation(
      fakeEvent({
        schedules: [
          {
            id: "sch-1",
            title: "Akad Nikah",
            description: null,
            date: new Date("2026-12-12T00:00:00Z"),
            startTime: new Date("1970-01-01T08:00:00Z"),
            endTime: new Date("1970-01-01T10:00:00Z"),
            venue: {
              name: "Gedung A",
              address: "Jl. Uji Coba No. 1",
              mapUrl: "https://maps.example.com",
              latitude: -6.2,
              longitude: 106.8,
            },
          },
        ] as never,
      }),
      null,
    );

    expect(dto.schedules).toHaveLength(1);
    expect(dto.schedules[0].date).toBe("2026-12-12");
    expect(dto.schedules[0].startTime).toBe("08:00");
    expect(dto.schedules[0].venue?.name).toBe("Gedung A");
  });

  it("strips an unsafe (javascript:) venue map URL rather than passing it through", () => {
    const dto = toPublicInvitation(
      fakeEvent({
        schedules: [
          {
            id: "sch-1",
            title: "Akad Nikah",
            description: null,
            date: new Date("2026-12-12T00:00:00Z"),
            startTime: new Date("1970-01-01T08:00:00Z"),
            endTime: new Date("1970-01-01T10:00:00Z"),
            venue: {
              name: "Gedung A",
              address: "Jl. Uji Coba No. 1",
              mapUrl: "javascript:alert(1)",
              latitude: null,
              longitude: null,
            },
          },
        ] as never,
      }),
      null,
    );

    expect(dto.schedules[0].venue?.mapUrl).toBeNull();
  });

  it("filters out a gallery item whose URL is unsafe (javascript:)", () => {
    const dto = toPublicInvitation(
      fakeEvent({
        galleries: [
          {
            title: null,
            items: [
              {
                id: "safe",
                type: "IMAGE",
                url: "https://example.com/a.jpg",
                thumbnailUrl: null,
                caption: null,
              },
              {
                id: "unsafe",
                type: "IMAGE",
                url: "javascript:alert(1)",
                thumbnailUrl: null,
                caption: null,
              },
            ],
          },
        ] as never,
      }),
      null,
    );

    expect(dto.galleries[0].items).toHaveLength(1);
    expect(dto.galleries[0].items[0].id).toBe("safe");
  });

  it("gracefully handles a schedule with no venue", () => {
    const dto = toPublicInvitation(
      fakeEvent({
        schedules: [
          {
            id: "sch-1",
            title: "Akad Nikah",
            description: null,
            date: new Date("2026-12-12T00:00:00Z"),
            startTime: new Date("1970-01-01T08:00:00Z"),
            endTime: new Date("1970-01-01T10:00:00Z"),
            venue: null,
          },
        ] as never,
      }),
      null,
    );

    expect(dto.schedules[0].venue).toBeNull();
  });

  it("does not crash when every optional relation is empty/missing", () => {
    expect(() => toPublicInvitation(fakeEvent(), null)).not.toThrow();

    const dto = toPublicInvitation(fakeEvent(), null);
    expect(dto.weddingProfile).toBeNull();
    expect(dto.loveStory).toBeNull();
    expect(dto.galleries).toEqual([]);
    expect(dto.giftMethods).toEqual([]);
  });

  it("maps a configured gift method's display fields", () => {
    const dto = toPublicInvitation(
      fakeEvent({
        giftMethods: [
          {
            id: "gift-1",
            type: "BANK",
            providerName: "Bank Contoh",
            accountName: "Budi Santoso",
            accountNumber: "1234567890",
            qrImageUrl: null,
            instructions: "Mohon konfirmasi setelah transfer.",
          },
        ] as never,
      }),
      null,
    );

    expect(dto.giftMethods).toHaveLength(1);
    expect(dto.giftMethods[0]).toEqual({
      id: "gift-1",
      type: "BANK",
      providerName: "Bank Contoh",
      accountName: "Budi Santoso",
      accountNumber: "1234567890",
      qrImageUrl: null,
      instructions: "Mohon konfirmasi setelah transfer.",
    });
  });

  it("strips an unsafe (javascript:) gift method QR image URL rather than passing it through", () => {
    const dto = toPublicInvitation(
      fakeEvent({
        giftMethods: [
          {
            id: "gift-1",
            type: "QR",
            providerName: null,
            accountName: null,
            accountNumber: null,
            qrImageUrl: "javascript:alert(1)",
            instructions: null,
          },
        ] as never,
      }),
      null,
    );

    expect(dto.giftMethods[0].qrImageUrl).toBeNull();
  });

  it("never exposes eventId/isActive/timestamps on a gift method", () => {
    const dto = toPublicInvitation(
      fakeEvent({
        giftMethods: [
          {
            id: "gift-1",
            type: "OTHER",
            providerName: "Alamat Pengiriman",
            accountName: null,
            accountNumber: null,
            qrImageUrl: null,
            instructions: "Jl. Contoh No. 1",
          },
        ] as never,
      }),
      null,
    );

    expect(dto.giftMethods[0]).not.toHaveProperty("eventId");
    expect(dto.giftMethods[0]).not.toHaveProperty("isActive");
    expect(dto.giftMethods[0]).not.toHaveProperty("createdAt");
    expect(dto.giftMethods[0]).not.toHaveProperty("updatedAt");
  });
});
