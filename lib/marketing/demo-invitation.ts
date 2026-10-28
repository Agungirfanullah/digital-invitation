import "server-only";

import { buildPublicIdentity } from "@/lib/event-types/identity";
import { resolveEnabledSections, resolveSectionOrder } from "@/lib/event-types/sections";
import { getTemplateDefaultTheme } from "@/lib/invitations/templates/default-themes";
import type { PublicInvitation } from "@/lib/invitations/types";

/**
 * A static, fabricated sample invitation for the Homepage's Invitation
 * Preview section (docs/PRD.md §8 item 5, D-073) — not backed by any real
 * `Event` row. Built through the same production functions
 * `lib/invitations/projection.ts`'s `toPublicInvitation()` uses
 * (`buildPublicIdentity`, `resolveEnabledSections`, `resolveSectionOrder`,
 * `getTemplateDefaultTheme`) so the preview renders through the real
 * template system, not a second one. No gallery/gift/wishes content is
 * included — inventing sample guest wishes or gift transactions would be
 * the same kind of fabricated social proof CLAUDE.md forbids for
 * Testimonials; the RSVP/Wishes sections already have a real, tested
 * "no personal link" fallback state (`components/rsvp/rsvp-section.tsx`)
 * that renders correctly with no guest token, which is what this preview
 * relies on instead.
 */
const DEMO_DAYS_AHEAD = 75;

/** A demo date always in the future, so the sample countdown never shows zeros. */
function demoEventDate(now: Date = new Date()): string {
  const date = new Date(now.getTime() + DEMO_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

export function buildDemoInvitation(templateKey: string = "minimal-elegant"): PublicInvitation {
  const type = "WEDDING" as const;

  return {
    eventId: "demo-invitation",
    slug: "demo",
    type,
    title: "Pernikahan Ayu & Budi",
    description: null,
    templateKey,
    theme: getTemplateDefaultTheme(templateKey),
    identity: buildPublicIdentity(type, {
      family: "COUPLE",
      data: {
        brideFullName: null,
        brideNickname: "Ayu",
        brideFather: null,
        brideMother: null,
        brideInstagram: null,
        groomFullName: null,
        groomNickname: "Budi",
        groomFather: null,
        groomMother: null,
        groomInstagram: null,
        bridePhotoUrl: null,
        groomPhotoUrl: null,
        yearsTogether: null,
      },
    }),
    // Countdown defaults to off for real events (D-068); the demo turns it on
    // so the sample shows the section.
    sections: { ...resolveEnabledSections(type, null), countdown: true },
    sectionOrder: resolveSectionOrder(null),
    // Irrelevant here — the Homepage always renders this through
    // `InvitationRenderer`'s `bypassOpening={true}`, which skips reading
    // this field entirely (D-069).
    openingEnabled: false,
    schedules: [
      {
        id: "demo-schedule",
        title: "Akad & Resepsi",
        description: null,
        date: demoEventDate(),
        startTime: "08:00",
        endTime: "12:00",
        venue: {
          name: "Gedung Serbaguna",
          address: "Jl. Uji Coba No. 1, Jakarta",
          mapUrl: null,
          latitude: null,
          longitude: null,
        },
      },
    ],
    loveStory: null,
    galleries: [],
    giftMethods: [],
    wishes: [],
    guest: null,
  };
}

/**
 * A small set of specific Picsum photo IDs (Picsum serves free-to-use
 * Unsplash photos, no attribution required), each individually viewed and
 * picked because it actually shows a person — not a random seed, which
 * (confirmed by inspection) just as often turns up a forest, a hiking
 * backpack, or a dog. Grouped into two moods and assigned per template so
 * the demo's cover/gallery photos suit that template's own palette,
 * instead of one photo style looking out of place everywhere. Still never
 * a real couple's photo (this product has no rights to use one) — these
 * are editorial/lifestyle portraits of individual models.
 */
const ELEGANT_PHOTO_IDS = [1027, 338];
const WARM_PHOTO_IDS = [64, 1012, 823];

const WARM_MOOD_SLUGS = new Set([
  "floral-romance",
  "soft-romantic",
  "cinematic-journey",
  "rustic-earth",
  "playful-pop",
  "blue-bloom",
  "garden-tropical",
]);

function demoPhotoIds(slug: string): number[] {
  return WARM_MOOD_SLUGS.has(slug) ? WARM_PHOTO_IDS : ELEGANT_PHOTO_IDS;
}

function demoPhotoUrl(id: number, width: number, height: number): string {
  return `https://picsum.photos/id/${id}/${width}/${height}`;
}

/**
 * The demo invitation with sample photos: a cover, member portraits and a
 * four-photo gallery, matched to the template's mood. Shared by the
 * `/demo/[slug]` page and the Homepage previews so both show the photo
 * features the same way.
 */
export function buildDemoInvitationWithPhotos(templateKey: string): PublicInvitation {
  const base = buildDemoInvitation(templateKey);
  const photoIds = demoPhotoIds(templateKey);

  return {
    ...base,
    identity: base.identity && {
      ...base.identity,
      members: base.identity.members.map((member, index) => ({
        ...member,
        photoUrl: demoPhotoUrl(photoIds[(index + 1) % photoIds.length], 400, 500),
      })),
    },
    theme: {
      ...base.theme,
      backgroundImageUrl: demoPhotoUrl(photoIds[0], 800, 1200),
    },
    galleries: [
      {
        title: null,
        items: [0, 1, 2, 3].map((i) => ({
          id: `demo-gallery-${i}`,
          type: "IMAGE" as const,
          url: demoPhotoUrl(photoIds[i % photoIds.length], 800, 800),
          thumbnailUrl: null,
          caption: null,
        })),
      },
    ],
  };
}

/** "modern-editorial" -> "Modern Editorial" — purely cosmetic, no DB round trip for a static demo page. */
export function templateDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
