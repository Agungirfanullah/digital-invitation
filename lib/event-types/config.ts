import type { EventType } from "@prisma/client";

/**
 * The single place where an `EventType` decides identity, terminology and
 * copy (docs/ARCHITECTURE.md §37). Shared capabilities (schedule, RSVP,
 * gallery, wishes, gifts, QR/check-in, analytics) never branch on the event
 * type — only this configuration does. Client-safe: no server imports.
 */

export const IDENTITY_FAMILIES = [
  "COUPLE",
  "PERSON",
  "BABY_FAMILY",
  "HOST_GROUP",
  "ORGANIZATION",
  "GENERIC",
] as const;

export type IdentityFamily = (typeof IDENTITY_FAMILIES)[number];

/** The families that store a profile. GENERIC (OTHER) has none — docs/PRD.md §13.7. */
export type ProfileIdentityFamily = Exclude<IdentityFamily, "GENERIC">;

export interface CoupleLabels {
  /** Label for the bride*-column person (form legend, and public role when `showRolesPublicly`). */
  first: string;
  /** Label for the groom*-column person. */
  second: string;
  showRolesPublicly: boolean;
}

export interface EventTypeConfig {
  family: IdentityFamily;
  /** Editor navigation label for the identity form; null when the type has no identity form. */
  identityNavLabel: string | null;
  /** Public heading of the identity section. */
  identityHeading: string;
  /** Only for the COUPLE family. */
  coupleLabels: CoupleLabels | null;
  /** Editor navigation label for the story/content section. */
  storyNavLabel: string;
  /** Helper text under the story editor heading. */
  storyDescription: string;
  /** Public fallback heading when the owner hasn't set a story title. */
  storyDefaultTitle: string;
  /** Public closing sentence. */
  closingMessage: string;
  /**
   * Whether publishing requires at least one schedule (the event date).
   * Combined with `maxAgendas` this defines the agenda-count range
   * (docs/F4_CANONICAL_PUBLISH_CONTRACT.md §4 / F4-09): `false` means a
   * minimum of 0 agendas (only WEDDING, the Phase 0.9 regression
   * baseline), `true` means a minimum of 1.
   */
  requiresDate: boolean;
  /**
   * The maximum number of schedules ("agendas") an event of this type may
   * have at publish time (F4-09, docs/F4_CANONICAL_PUBLISH_CONTRACT.md §4).
   * WEDDING is the only type allowed 2; every other type allows exactly 1
   * (combined with `requiresDate: true`, meaning non-Wedding types must
   * have exactly 1 agenda). See
   * `lib/event-types/identity.ts`'s `getMissingPublishRequirements()` for
   * how this and the venue requirement are resolved together.
   */
  maxAgendas: number;
}

const HONOR = "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i";

export const EVENT_TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
  WEDDING: {
    family: "COUPLE",
    identityNavLabel: "Mempelai",
    identityHeading: "Mempelai",
    coupleLabels: { first: "Mempelai Wanita", second: "Mempelai Pria", showRolesPublicly: true },
    storyNavLabel: "Kisah Cinta",
    storyDescription: "Perjalanan kisah kalian, dari awal bertemu hingga menikah.",
    storyDefaultTitle: "Kisah Kami",
    closingMessage: `${HONOR} berkenan hadir dan memberikan doa restu.`,
    // Wedding is the regression baseline: its existing publish behavior
    // only gains the couple-name requirement, not a schedule requirement.
    requiresDate: false,
    // F4-09 §4.3: Wedding is the only type allowed a 2nd agenda.
    maxAgendas: 2,
  },
  ENGAGEMENT: {
    family: "COUPLE",
    identityNavLabel: "Calon Mempelai",
    identityHeading: "Calon Mempelai",
    coupleLabels: {
      first: "Calon Mempelai Wanita",
      second: "Calon Mempelai Pria",
      showRolesPublicly: true,
    },
    storyNavLabel: "Kisah Cinta",
    storyDescription: "Perjalanan kisah kalian, dari awal bertemu hingga hari lamaran.",
    storyDefaultTitle: "Kisah Kami",
    closingMessage: `${HONOR} berkenan hadir dan memberikan doa restu.`,
    requiresDate: true,
    maxAgendas: 1, // F4-09 §4.4
  },
  ANNIVERSARY: {
    family: "COUPLE",
    identityNavLabel: "Pasangan",
    identityHeading: "Pasangan",
    coupleLabels: { first: "Istri", second: "Suami", showRolesPublicly: false },
    storyNavLabel: "Kisah Kami",
    storyDescription: "Momen-momen berharga sepanjang perjalanan kalian bersama.",
    storyDefaultTitle: "Perjalanan Kami",
    closingMessage: `${HONOR} berkenan hadir dan turut merayakan kebahagiaan kami.`,
    requiresDate: true,
    maxAgendas: 1, // F4-09 §4.4
  },
  BIRTHDAY: {
    family: "PERSON",
    identityNavLabel: "Yang Berulang Tahun",
    identityHeading: "Yang Berulang Tahun",
    coupleLabels: null,
    storyNavLabel: "Cerita / Pesan",
    storyDescription: "Cerita atau pesan singkat tentang yang berulang tahun.",
    storyDefaultTitle: "Cerita",
    closingMessage: `${HONOR} berkenan hadir dan merayakan hari istimewa ini bersama kami.`,
    requiresDate: true,
    maxAgendas: 1, // F4-09 §4.4
  },
  AQIQAH: {
    family: "BABY_FAMILY",
    identityNavLabel: "Buah Hati & Keluarga",
    identityHeading: "Buah Hati Kami",
    coupleLabels: null,
    storyNavLabel: "Cerita Keluarga",
    storyDescription: "Cerita atau pesan keluarga untuk para tamu.",
    storyDefaultTitle: "Cerita Kami",
    closingMessage: `${HONOR} berkenan hadir dan memberikan doa terbaik untuk buah hati kami.`,
    requiresDate: true,
    maxAgendas: 1, // F4-09 §4.4
  },
  GATHERING: {
    family: "HOST_GROUP",
    identityNavLabel: "Tuan Rumah",
    identityHeading: "Tuan Rumah",
    coupleLabels: null,
    storyNavLabel: "Tentang Acara",
    storyDescription: "Informasi tambahan tentang acara ini.",
    storyDefaultTitle: "Tentang Acara",
    closingMessage: `${HONOR} berkenan hadir dan meramaikan acara ini.`,
    requiresDate: true,
    maxAgendas: 1, // F4-09 §4.4
  },
  CORPORATE: {
    family: "ORGANIZATION",
    identityNavLabel: "Organisasi",
    identityHeading: "Penyelenggara",
    coupleLabels: null,
    storyNavLabel: "Tentang Acara",
    storyDescription: "Agenda, latar belakang, atau informasi tambahan acara.",
    storyDefaultTitle: "Tentang Acara",
    closingMessage:
      "Merupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir pada acara ini.",
    requiresDate: true,
    maxAgendas: 1, // F4-09 §4.4
  },
  OTHER: {
    family: "GENERIC",
    identityNavLabel: null,
    identityHeading: "Informasi Acara",
    coupleLabels: null,
    storyNavLabel: "Konten",
    storyDescription: "Informasi tambahan tentang acara ini.",
    storyDefaultTitle: "Tentang Acara",
    closingMessage: `${HONOR} berkenan hadir.`,
    requiresDate: true,
    maxAgendas: 1, // F4-09 §4.4
  },
};

export function getIdentityFamily(type: EventType): IdentityFamily {
  return EVENT_TYPE_CONFIG[type].family;
}

/** Shared public closing line, identical for every type. */
export const CLOSING_THANKS = "Terima kasih atas perhatiannya.";

export interface InvitationCopy {
  storyDefaultTitle: string;
  closingMessage: string;
  closingThanks: string;
}

/** The type-aware public copy every template renders — templates never hard-code event-type wording. */
export function getInvitationCopy(type: EventType): InvitationCopy {
  const config = EVENT_TYPE_CONFIG[type];
  return {
    storyDefaultTitle: config.storyDefaultTitle,
    closingMessage: config.closingMessage,
    closingThanks: CLOSING_THANKS,
  };
}
