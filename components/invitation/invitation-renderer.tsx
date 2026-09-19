import { resolveTemplateComponent } from "@/lib/invitations/templates/registry";
import type { PublicInvitation } from "@/lib/invitations/types";
import type { RsvpGuestView } from "@/lib/rsvp/types";

/**
 * The single entry point from the public route into the template system.
 * `/invite/[slug]` should only ever need to resolve data and render this
 * — no template-specific logic belongs in the route itself, so adding a
 * template later never means touching the route.
 */
// resolveTemplateComponent() returns a stable reference from a static
// registry lookup (see lib/invitations/templates/registry.ts), not a
// freshly-constructed component, so the remount concern
// react-hooks/static-components guards against doesn't apply here. This
// dynamic resolution is the Phase 3 template-registry requirement.
/* eslint-disable react-hooks/static-components */
export function InvitationRenderer({
  invitation,
  rsvp,
}: {
  invitation: PublicInvitation;
  rsvp?: { token: string; view: RsvpGuestView } | null;
}) {
  const Template = resolveTemplateComponent(invitation.templateKey);
  return <Template invitation={invitation} rsvp={rsvp} />;
}
/* eslint-enable react-hooks/static-components */
