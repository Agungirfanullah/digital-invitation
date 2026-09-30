import type { EventType } from "@prisma/client";

import {
  buildPublicIdentity,
  type CoupleIdentityData,
  type IdentityProfileData,
} from "@/lib/event-types/identity";
import { resolveEnabledSections, resolveSectionOrder } from "@/lib/event-types/sections";
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
    identity: null,
    sections: resolveEnabledSections(overrides.type ?? "WEDDING", null),
    sectionOrder: resolveSectionOrder(null),
    openingEnabled: true,
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
    // Built through the real canonical transformation, not hand-written,
    // so template tests exercise exactly what production renders.
    identity: buildPublicIdentity("WEDDING", WEDDING_IDENTITY),
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

const COUPLE_DATA: CoupleIdentityData = {
  brideFullName: "Ayu Lestari",
  brideNickname: "Ayu",
  brideFather: "Bapak Lestari",
  brideMother: "Ibu Lestari",
  brideInstagram: "ayulestari",
  groomFullName: "Budi Santoso",
  groomNickname: "Budi",
  groomFather: "Bapak Santoso",
  groomMother: "Ibu Santoso",
  groomInstagram: "budisantoso",
  yearsTogether: null,
};

export const WEDDING_IDENTITY: IdentityProfileData = { family: "COUPLE", data: COUPLE_DATA };

/** A realistic, fully-filled identity for every event type (OTHER has none). */
export const IDENTITY_BY_TYPE: Record<EventType, IdentityProfileData> = {
  WEDDING: WEDDING_IDENTITY,
  ENGAGEMENT: { family: "COUPLE", data: COUPLE_DATA },
  ANNIVERSARY: { family: "COUPLE", data: { ...COUPLE_DATA, yearsTogether: 25 } },
  BIRTHDAY: {
    family: "PERSON",
    data: {
      fullName: "Citra Anindya",
      nickname: "Citra",
      age: 17,
      milestone: "Sweet Seventeen",
      hostedBy: "Keluarga Bapak Andi",
      instagram: "citra.a",
    },
  },
  AQIQAH: {
    family: "BABY_FAMILY",
    data: {
      babyFullName: "Muhammad Rafa Alfarizi",
      babyNickname: "Rafa",
      fatherName: "Rizky Pratama",
      motherName: "Nadia Putri",
      birthDate: "2026-08-17",
      birthDetails: "Anak pertama",
    },
  },
  GATHERING: {
    family: "HOST_GROUP",
    data: {
      hostName: "Keluarga Besar Wiryo",
      occasionTheme: "Nuansa Putih",
      contactInfo: "0812-0000-0000",
    },
  },
  CORPORATE: {
    family: "ORGANIZATION",
    data: { organizationName: "PT Maju Bersama", contactPerson: "Dewi (HR)", dressCode: "Batik" },
  },
  OTHER: { family: "GENERIC" },
};

/** A fully-populated invitation for `type`, with that type's own identity. */
export function buildInvitationForType(
  type: EventType,
  overrides: Partial<PublicInvitation> = {},
): PublicInvitation {
  return buildFullyPopulatedInvitation({
    type,
    title: `Acara ${type}`,
    identity: buildPublicIdentity(type, IDENTITY_BY_TYPE[type]),
    sections: resolveEnabledSections(type, null),
    ...overrides,
  });
}
