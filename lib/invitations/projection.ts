import "server-only";
import type { Prisma } from "@prisma/client";

import { parseTheme } from "@/lib/invitations/theme";
import type { PublicGuestContext, PublicInvitation } from "@/lib/invitations/types";

/**
 * The only relations the public renderer needs. Deliberately excludes
 * `owner`, `members`, `giftTransactions`, `invitationViews`, and anything
 * else not required to render the invitation — see docs/DATABASE.md §37
 * and ARCHITECTURE.md §14 on public invitation privacy.
 */
export const PUBLIC_EVENT_INCLUDE = {
  template: { select: { slug: true } },
  theme: true,
  weddingProfile: true,
  schedules: {
    orderBy: { sortOrder: "asc" },
    include: { venue: true },
  },
  loveStories: {
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  },
  galleries: {
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  },
} satisfies Prisma.EventInclude;

export type PublicEventRecord = Prisma.EventGetPayload<{ include: typeof PUBLIC_EVENT_INCLUDE }>;

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatTimeOnly(date: Date): string {
  return date.toISOString().slice(11, 16);
}

/** Transforms a raw (but already relation-scoped) Event record into the public DTO. Never receives or returns owner/member/payment/audit data. */
export function toPublicInvitation(
  event: PublicEventRecord,
  guest: PublicGuestContext | null,
): PublicInvitation {
  return {
    eventId: event.id,
    slug: event.slug,
    type: event.type,
    title: event.title,
    description: event.description,
    templateKey: event.template?.slug ?? null,
    theme: parseTheme(event.theme),
    weddingProfile: event.weddingProfile
      ? {
          brideFullName: event.weddingProfile.brideFullName,
          brideNickname: event.weddingProfile.brideNickname,
          brideInstagram: event.weddingProfile.brideInstagram,
          groomFullName: event.weddingProfile.groomFullName,
          groomNickname: event.weddingProfile.groomNickname,
          groomInstagram: event.weddingProfile.groomInstagram,
        }
      : null,
    schedules: event.schedules.map((schedule) => ({
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      date: formatDateOnly(schedule.date),
      startTime: formatTimeOnly(schedule.startTime),
      endTime: formatTimeOnly(schedule.endTime),
      venue: schedule.venue
        ? {
            name: schedule.venue.name,
            address: schedule.venue.address,
            mapUrl: schedule.venue.mapUrl,
            latitude: schedule.venue.latitude,
            longitude: schedule.venue.longitude,
          }
        : null,
    })),
    loveStory: event.loveStories[0]
      ? {
          title: event.loveStories[0].title,
          items: event.loveStories[0].items.map((item) => ({
            id: item.id,
            dateLabel: item.dateLabel,
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl,
          })),
        }
      : null,
    galleries: event.galleries.map((gallery) => ({
      title: gallery.title,
      items: gallery.items.map((item) => ({
        id: item.id,
        type: item.type,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        caption: item.caption,
      })),
    })),
    guest,
  };
}
