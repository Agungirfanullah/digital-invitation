import type { EventType, GalleryItemType } from "@prisma/client";

/**
 * Public-safe DTOs for the `/invite/[slug]` rendering pipeline. Nothing
 * here may include owner/member identifiers, payment/subscription data,
 * audit data, or private guest fields — see docs/DATABASE.md §37 and
 * ARCHITECTURE.md §14.
 */

export interface PublicGuestContext {
  displayName: string;
}

export interface PublicVenue {
  name: string;
  address: string;
  mapUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PublicSchedule {
  id: string;
  title: string;
  description: string | null;
  /** ISO date (YYYY-MM-DD), no time component. */
  date: string;
  /** 24h HH:mm, in the value stored (no timezone conversion applied). */
  startTime: string;
  endTime: string;
  venue: PublicVenue | null;
}

export interface PublicLoveStoryItem {
  id: string;
  dateLabel: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

export interface PublicLoveStory {
  title: string | null;
  items: PublicLoveStoryItem[];
}

export interface PublicGalleryItem {
  id: string;
  type: GalleryItemType;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
}

export interface PublicGallery {
  title: string | null;
  items: PublicGalleryItem[];
}

export interface PublicWeddingProfile {
  brideFullName: string | null;
  brideNickname: string | null;
  brideInstagram: string | null;
  groomFullName: string | null;
  groomNickname: string | null;
  groomInstagram: string | null;
}

export interface PublicTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  scriptFont: string;
  backgroundImageUrl: string | null;
}

export interface PublicInvitation {
  eventId: string;
  slug: string;
  type: EventType;
  title: string;
  description: string | null;
  /** Raw template slug from the DB, or null. The renderer/registry decides how to interpret an unrecognized value — this DTO just reports what's there. */
  templateKey: string | null;
  theme: PublicTheme;
  weddingProfile: PublicWeddingProfile | null;
  schedules: PublicSchedule[];
  loveStory: PublicLoveStory | null;
  galleries: PublicGallery[];
  guest: PublicGuestContext | null;
}
