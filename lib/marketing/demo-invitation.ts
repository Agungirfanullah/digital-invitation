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
        yearsTogether: null,
      },
    }),
    sections: resolveEnabledSections(type, null),
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
        date: "2026-12-12",
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
