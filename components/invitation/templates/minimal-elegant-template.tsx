import type { InvitationTemplateProps } from "@/lib/invitations/templates/registry";
import { themeToCssVars } from "@/components/invitation/theme-vars";
import { HeroSection } from "@/components/invitation/sections/hero-section";
import { CoupleSection } from "@/components/invitation/sections/couple-section";
import { ScheduleSection } from "@/components/invitation/sections/schedule-section";
import { LoveStorySection } from "@/components/invitation/sections/love-story-section";
import { GallerySection } from "@/components/invitation/sections/gallery-section";
import { GiftSection } from "@/components/invitation/sections/gift-section";
import { WishesSection } from "@/components/invitation/sections/wishes-section";
import { RsvpSection } from "@/components/rsvp/rsvp-section";
import { ClosingSection } from "@/components/invitation/sections/closing-section";

/**
 * The first real, working template. Genuinely renders whatever data the
 * event actually has — every section beyond Hero/Closing is conditional
 * on real backing data existing (see each section's own guard), so an
 * event with only a title still renders a complete, honest page instead
 * of empty placeholders.
 */
export function MinimalElegantTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
  return (
    <main
      style={themeToCssVars(invitation.theme)}
      className="min-h-screen bg-[color:var(--ii-background)]"
    >
      <div style={{ fontFamily: "var(--ii-body-font)" }}>
        <HeroSection invitation={invitation} />
        {invitation.weddingProfile && <CoupleSection profile={invitation.weddingProfile} />}
        <ScheduleSection schedules={invitation.schedules} />
        <LoveStorySection loveStory={invitation.loveStory} />
        <GallerySection galleries={invitation.galleries} />
        <RsvpSection eventId={invitation.eventId} rsvp={rsvp ?? null} />
        <GiftSection giftMethods={invitation.giftMethods} />
        <WishesSection
          eventId={invitation.eventId}
          wishes={invitation.wishes}
          guest={wishGuest ?? null}
        />
        <ClosingSection />
      </div>
    </main>
  );
}
