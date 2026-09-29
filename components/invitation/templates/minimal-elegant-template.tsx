import type { InvitationTemplateProps } from "@/lib/invitations/templates/registry";
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
 * placeholders.
 */
export function MinimalElegantTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
  const { sections } = invitation;
  const copy = getInvitationCopy(invitation.type);

  return (
    <main
      style={themeToCssVars(invitation.theme)}
      className="min-h-screen bg-[color:var(--ii-background)]"
    >
      <div style={{ fontFamily: "var(--ii-body-font)" }}>
        {sections.hero && <HeroSection invitation={invitation} />}
        {sections.identity && invitation.identity && (
          <IdentitySection identity={invitation.identity} />
        )}
        {sections.schedule && <ScheduleSection schedules={invitation.schedules} />}
        <LoveStorySection loveStory={invitation.loveStory} defaultTitle={copy.storyDefaultTitle} />
        <GallerySection galleries={invitation.galleries} />
        {sections.rsvp && <RsvpSection eventId={invitation.eventId} rsvp={rsvp ?? null} />}
        <GiftSection giftMethods={invitation.giftMethods} />
        {sections.wishes && (
          <WishesSection
            eventId={invitation.eventId}
            wishes={invitation.wishes}
            guest={wishGuest ?? null}
          />
        )}
        <ClosingSection type={invitation.type} />
      </div>
    </main>
  );
}
