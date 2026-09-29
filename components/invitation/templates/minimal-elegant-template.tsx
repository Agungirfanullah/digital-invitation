import { Fragment, type ReactNode } from "react";
import type { InvitationTemplateProps } from "@/lib/invitations/templates/registry";
import type { InvitationSectionKey } from "@/lib/event-types/sections";
import { getInvitationCopy } from "@/lib/event-types/config";
import { themeToCssVars } from "@/components/invitation/theme-vars";
import { HeroSection } from "@/components/invitation/sections/hero-section";
import { IdentitySection } from "@/components/invitation/sections/identity-section";
import { ScheduleSection } from "@/components/invitation/sections/schedule-section";
import { LoveStorySection } from "@/components/invitation/sections/love-story-section";
import { GallerySection } from "@/components/invitation/sections/gallery-section";
import { GiftSection } from "@/components/invitation/sections/gift-section";
import { WishesSection } from "@/components/invitation/sections/wishes-section";
import { RsvpSection } from "@/components/rsvp/rsvp-section";
import { ClosingSection } from "@/components/invitation/sections/closing-section";

/**
 * The first real, working template. Genuinely renders whatever data the
 * event actually has — every section beyond Closing is conditional on
 * real backing data existing (see each section's own guard) and on the
 * event's section configuration (`invitation.sections`, which now
 * includes `hero` — docs/DECISIONS.md D-064), so an event with only a
 * title still renders a complete, honest page instead of empty
 * placeholders. Configurable sections render in `invitation.sectionOrder`
 * (docs/PRD.md §15 "Reorder", D-066/D-067) — each section's own
 * enable/data guard below is unchanged; only the sequence they're
 * evaluated in is now data-driven instead of hard-coded. Closing always
 * renders last, outside the ordered sequence (D-064).
 */
export function MinimalElegantTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
  const { sections } = invitation;
  const copy = getInvitationCopy(invitation.type);

  const sectionRenderers: Record<InvitationSectionKey, ReactNode> = {
    hero: sections.hero && <HeroSection invitation={invitation} />,
    identity: sections.identity && invitation.identity && (
      <IdentitySection identity={invitation.identity} />
    ),
    schedule: sections.schedule && <ScheduleSection schedules={invitation.schedules} />,
    story: (
      <LoveStorySection loveStory={invitation.loveStory} defaultTitle={copy.storyDefaultTitle} />
    ),
    gallery: <GallerySection galleries={invitation.galleries} />,
    rsvp: sections.rsvp && <RsvpSection eventId={invitation.eventId} rsvp={rsvp ?? null} />,
    gift: <GiftSection giftMethods={invitation.giftMethods} />,
    wishes: sections.wishes && (
      <WishesSection
        eventId={invitation.eventId}
        wishes={invitation.wishes}
        guest={wishGuest ?? null}
      />
    ),
  };

  return (
    <main
      style={themeToCssVars(invitation.theme)}
      className="min-h-screen bg-[color:var(--ii-background)]"
    >
      <div style={{ fontFamily: "var(--ii-body-font)" }}>
        {invitation.sectionOrder.map((key) => (
          <Fragment key={key}>{sectionRenderers[key]}</Fragment>
        ))}
        <ClosingSection type={invitation.type} />
      </div>
    </main>
  );
}
