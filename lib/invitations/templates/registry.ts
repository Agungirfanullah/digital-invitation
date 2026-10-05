import type { ComponentType } from "react";

import { MinimalElegantTemplate } from "@/components/invitation/templates/minimal-elegant-template";
import { ModernEditorialTemplate } from "@/components/invitation/templates/modern-editorial-template";
import { FloralRomanceTemplate } from "@/components/invitation/templates/floral-romance-template";
import { DarkLuxuryTemplate } from "@/components/invitation/templates/dark-luxury-template";
import { TraditionalNusantaraTemplate } from "@/components/invitation/templates/traditional-nusantara-template";
import { SoftRomanticTemplate } from "@/components/invitation/templates/soft-romantic-template";
import { CinematicJourneyTemplate } from "@/components/invitation/templates/cinematic-journey-template";
import { RusticEarthTemplate } from "@/components/invitation/templates/rustic-earth-template";
import { PlayfulPopTemplate } from "@/components/invitation/templates/playful-pop-template";
import { RoyalGoldTemplate } from "@/components/invitation/templates/royal-gold-template";
import { BlueBloomTemplate } from "@/components/invitation/templates/blue-bloom-template";
import { MonoFrameTemplate } from "@/components/invitation/templates/mono-frame-template";
import { GardenTropicalTemplate } from "@/components/invitation/templates/garden-tropical-template";
import { ArtDecoTemplate } from "@/components/invitation/templates/art-deco-template";
import { VintageSepiaTemplate } from "@/components/invitation/templates/vintage-sepia-template";
import { IndustrialLoftTemplate } from "@/components/invitation/templates/industrial-loft-template";
import type { PublicInvitation } from "@/lib/invitations/types";
import type { RsvpGuestView } from "@/lib/rsvp/types";

export interface InvitationTemplateProps {
  invitation: PublicInvitation;
  /**
   * Deliberately separate from `PublicInvitation` rather than a field on
   * it — see docs/DECISIONS.md D-025. Present only when `?to=` resolved to
   * a valid, same-event guest; `null`/`undefined` otherwise (anonymous
   * visitor or an invalid/foreign token), in which case a template must
   * not render a submittable RSVP form.
   */
  rsvp?: { token: string; view: RsvpGuestView } | null;
  /**
   * Present only when `?to=` resolved to a valid, same-event guest —
   * reuses the guest context already resolved for `invitation.guest`
   * rather than a second lookup like `rsvp` needs (see
   * docs/DECISIONS.md D-039). A template must not render a submittable
   * wish form without this, since `Wish.guestId` is a required column
   * with no anonymous identity to attach a submission to.
   */
  wishGuest?: { token: string; guestName: string } | null;
}

/**
 * All six templates seeded as `Template` rows (see prisma/seed.ts,
 * matching docs/ROADMAP.md's Phase 3 template names) now have a real,
 * genuinely distinct implementation — see the Phase 3 design audit for
 * each template's own design brief. Every seeded slug maps here so an
 * event can reference any of them without erroring; an unknown/removed
 * slug still safely falls back to the default template rather than
 * crashing or showing a blank page.
 */
const TEMPLATE_REGISTRY: Record<string, ComponentType<InvitationTemplateProps>> = {
  "minimal-elegant": MinimalElegantTemplate,
  "modern-editorial": ModernEditorialTemplate,
  "floral-romance": FloralRomanceTemplate,
  "dark-luxury": DarkLuxuryTemplate,
  "traditional-nusantara": TraditionalNusantaraTemplate,
  "soft-romantic": SoftRomanticTemplate,
  "cinematic-journey": CinematicJourneyTemplate,
  "rustic-earth": RusticEarthTemplate,
  "playful-pop": PlayfulPopTemplate,
  "royal-gold": RoyalGoldTemplate,
  "blue-bloom": BlueBloomTemplate,
  "mono-frame": MonoFrameTemplate,
  "garden-tropical": GardenTropicalTemplate,
  "art-deco": ArtDecoTemplate,
  "vintage-sepia": VintageSepiaTemplate,
  "industrial-loft": IndustrialLoftTemplate,
};

const DEFAULT_TEMPLATE_KEY = "minimal-elegant";

/** Resolves a template slug to its component. An unknown or missing key safely falls back to the default rather than crashing. */
export function resolveTemplateComponent(
  templateKey: string | null,
): ComponentType<InvitationTemplateProps> {
  if (templateKey && templateKey in TEMPLATE_REGISTRY) {
    return TEMPLATE_REGISTRY[templateKey];
  }
  return TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_KEY];
}

export function isKnownTemplateKey(templateKey: string | null | undefined): boolean {
  return !!templateKey && templateKey in TEMPLATE_REGISTRY;
}
