import { Fragment, type ReactNode } from "react";
import type { InvitationTemplateProps } from "@/lib/invitations/templates/registry";
import type { InvitationSectionKey } from "@/lib/event-types/sections";
import { getInvitationCopy } from "@/lib/event-types/config";
import { themeToCssVars } from "@/components/invitation/theme-vars";
import { HeroSection } from "@/components/invitation/sections/hero-section";
import { IdentitySection } from "@/components/invitation/sections/identity-section";
import { CountdownSection } from "@/components/invitation/sections/countdown-section";
import { ScheduleSection } from "@/components/invitation/sections/schedule-section";
import { LoveStorySection } from "@/components/invitation/sections/love-story-section";
import { GallerySection } from "@/components/invitation/sections/gallery-section";
import { GiftSection } from "@/components/invitation/sections/gift-section";
import { WishesSection } from "@/components/invitation/sections/wishes-section";
import { RsvpSection } from "@/components/rsvp/rsvp-section";
import { ClosingSection } from "@/components/invitation/sections/closing-section";

/**
 * A tiny register-mark tick (a plus-sign cross) at the page's top-left and
 * bottom-right corners — the one, deliberately understated signature
 * touch for this template. Minimal Elegant's whole identity is the
 * plainest/baseline option (it renders the shared section components
 * directly, with no bespoke composition of its own — see the function
 * doc comment below), so this stays a single quiet mark rather than any
 * florid motif that would contradict that.
 */
function CornerTick({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="var(--ii-accent)"
      strokeWidth={1}
    >
      <path d="M12 5v6M5 12h6" />
    </svg>
  );
}

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
    countdown: sections.countdown && <CountdownSection invitation={invitation} />,
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
      className="relative min-h-screen bg-[color:var(--ii-background)]"
    >
      <CornerTick className="absolute top-6 left-6 size-4 opacity-60" />
      <CornerTick className="absolute right-6 bottom-6 size-4 opacity-60" />
      <div style={{ fontFamily: "var(--ii-body-font)" }}>
        {invitation.sectionOrder.map((key) => (
          <Fragment key={key}>{sectionRenderers[key]}</Fragment>
        ))}
        <ClosingSection type={invitation.type} />
      </div>
    </main>
  );
}
