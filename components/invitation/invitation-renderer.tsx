import { OpeningGate } from "@/components/invitation/opening-gate";
import { resolveTemplateComponent } from "@/lib/invitations/templates/registry";
import type { PublicInvitation } from "@/lib/invitations/types";
import type { RsvpGuestView } from "@/lib/rsvp/types";

/**
 * The single entry point from the public route into the template system.
 * `/invite/[slug]` should only ever need to resolve data and render this
 * — no template-specific logic belongs in the route itself, so adding a
 * template later never means touching the route.
 *
 * `bypassOpening` (docs/PRD.md §17, D-069): the editor's live preview
 * passes `true` here so the owner can see/edit content without
 * repeatedly clicking through the Opening gate on every re-render — an
 * editor-UX-only behavior that never affects the public invitation,
 * which never passes this prop (defaults to active). This is the
 * smallest local mechanism that distinguishes the two contexts; no new
 * global rendering architecture is introduced.
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
  wishGuest,
  bypassOpening = false,
}: {
  invitation: PublicInvitation;
  rsvp?: { token: string; view: RsvpGuestView } | null;
  wishGuest?: { token: string; guestName: string } | null;
  bypassOpening?: boolean;
}) {
  const Template = resolveTemplateComponent(invitation.templateKey);
  const content = <Template invitation={invitation} rsvp={rsvp} wishGuest={wishGuest} />;

  if (bypassOpening) return content;
  return <OpeningGate invitation={invitation}>{content}</OpeningGate>;
}
/* eslint-enable react-hooks/static-components */
