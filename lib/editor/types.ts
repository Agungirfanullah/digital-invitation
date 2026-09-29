import type { EventStatus, EventType, GalleryItemType } from "@prisma/client";

import type { IdentityProfileData } from "@/lib/event-types/identity";
import type { SectionOverrides } from "@/lib/event-types/sections";

/**
 * The authenticated owner/editor's view of an event's editable content.
 * Distinct from `PublicInvitation` (lib/invitations/types.ts): this
 * carries entity ids (needed to target update/delete mutations) and raw
 * nullable fields as actually stored — no default-value fallback, unlike
 * the public projection's `parseTheme()`. An empty field here means
 * "genuinely unset," not "render with a neutral default."
 */

export interface EditorTheme {
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  accentColor: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  scriptFont: string | null;
  backgroundImageUrl: string | null;
}

export interface EditorVenue {
  name: string;
  address: string;
  mapUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface EditorSchedule {
  id: string;
  title: string;
  description: string | null;
  /** ISO date (YYYY-MM-DD), matches an <input type="date"> value. */
  date: string;
  /** HH:mm, matches an <input type="time"> value. */
  startTime: string;
  endTime: string;
  venue: EditorVenue | null;
}

export interface EditorLoveStoryItem {
  id: string;
  dateLabel: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

export interface EditorLoveStory {
  id: string;
  title: string | null;
  items: EditorLoveStoryItem[];
}

export interface EditorGalleryItem {
  id: string;
  type: GalleryItemType;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
}

export interface EditorGallery {
  id: string;
  title: string | null;
  items: EditorGalleryItem[];
}

export interface EditorTemplateOption {
  slug: string;
  name: string;
  /** Whether this seeded Template row has a real implementation in the template registry — see lib/invitations/templates/registry.ts. */
  implemented: boolean;
}

export interface EditorEventData {
  eventId: string;
  title: string;
  slug: string;
  type: EventType;
  status: EventStatus;
  description: string | null;
  templateKey: string | null;
  /** Always the event type's own family — lib/event-types/identity-record.ts. */
  identity: IdentityProfileData;
  /** Persisted owner section overrides; resolve with lib/event-types/sections.ts. */
  sectionOverrides: SectionOverrides;
  theme: EditorTheme | null;
  schedules: EditorSchedule[];
  loveStory: EditorLoveStory | null;
  gallery: EditorGallery | null;
}

export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
