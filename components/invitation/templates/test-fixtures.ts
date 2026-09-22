import { DEFAULT_THEME } from "@/lib/invitations/theme";
import type { PublicInvitation } from "@/lib/invitations/types";

/** Title-only event — every optional relation absent, exactly what a brand-new event looks like. */
export function buildMinimalInvitation(
  overrides: Partial<PublicInvitation> = {},
): PublicInvitation {
  return {
    eventId: "event-1",
    slug: "uji-coba",
    type: "WEDDING",
    title: "Pernikahan Uji Coba",
    description: null,
    templateKey: null,
    theme: DEFAULT_THEME,
    weddingProfile: null,
    schedules: [],
    loveStory: null,
    galleries: [],
    giftMethods: [],
    wishes: [],
    guest: null,
    ...overrides,
  };
}

/** Every optional section populated — the inverse smoke test. */
export function buildFullyPopulatedInvitation(
  overrides: Partial<PublicInvitation> = {},
): PublicInvitation {
  return buildMinimalInvitation({
    description: "Deskripsi acara uji coba.",
    weddingProfile: {
      brideFullName: "Ayu Lestari",
      brideNickname: "Ayu",
      brideInstagram: "ayulestari",
      groomFullName: "Budi Santoso",
      groomNickname: "Budi",
      groomInstagram: "budisantoso",
    },
    schedules: [
      {
        id: "sch-1",
        title: "Akad Nikah",
        description: "Upacara akad nikah.",
        date: "2026-12-12",
        startTime: "08:00",
        endTime: "10:00",
        venue: {
          name: "Gedung Serbaguna",
          address: "Jl. Uji Coba No. 1, Jakarta",
          mapUrl: "https://maps.example.com",
          latitude: -6.2,
          longitude: 106.8,
        },
      },
    ],
    loveStory: {
      title: "Kisah Kami",
      items: [
        {
          id: "story-1",
          dateLabel: "Januari 2020",
          title: "Pertama Bertemu",
          description: "Kami bertemu pertama kali.",
          imageUrl: "https://example.com/story.jpg",
        },
      ],
    },
    galleries: [
      {
        title: "Momen Kami",
        items: [
          {
            id: "img-1",
            type: "IMAGE",
            url: "https://example.com/1.jpg",
            thumbnailUrl: null,
            caption: "Foto 1",
          },
          {
            id: "img-2",
            type: "IMAGE",
            url: "https://example.com/2.jpg",
            thumbnailUrl: null,
            caption: "Foto 2",
          },
        ],
      },
    ],
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
    ],
    wishes: [
      {
        id: "wish-1",
        name: "Citra Dewi",
        message: "Selamat menempuh hidup baru!",
        createdAt: new Date("2026-11-01T10:00:00Z"),
      },
    ],
    guest: { displayName: "Dedi Pratama" },
    ...overrides,
  });
}
