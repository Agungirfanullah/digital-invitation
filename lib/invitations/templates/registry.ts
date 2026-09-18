import type { ComponentType } from "react";

import { MinimalElegantTemplate } from "@/components/invitation/templates/minimal-elegant-template";
import type { PublicInvitation } from "@/lib/invitations/types";

export interface InvitationTemplateProps {
  invitation: PublicInvitation;
}

/**
 * Six templates are seeded as `Template` rows (see prisma/seed.ts, matching
 * docs/ROADMAP.md's Phase 3 template names), but only one has a real
 * implementation so far — building five more visually-distinct templates
 * without the editor/theme UI to configure them would just be five
 * reskins pretending to be finished products. Every seeded slug maps here
 * so an event can reference any of them without erroring; unimplemented
 * slugs safely render the default template rather than crashing or
 * showing a blank page.
 */
const TEMPLATE_REGISTRY: Record<string, ComponentType<InvitationTemplateProps>> = {
  "minimal-elegant": MinimalElegantTemplate,
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
