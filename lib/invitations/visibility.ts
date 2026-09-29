import type { PublicInvitation } from "@/lib/invitations/types";

/**
 * Removes the content of disabled sections from a `PublicInvitation`, so a
 * disabled section's data (e.g. gift account numbers) is never serialized
 * to the browser at all — hiding it in a template alone would still ship it
 * in the RSC payload. Shared by the public projection and the editor
 * preview so both apply the same rules. Identity and schedules are kept
 * even when their section is off: the hero still needs the display name and
 * the event date.
 */
export function stripDisabledSectionContent(invitation: PublicInvitation): PublicInvitation {
  const { sections } = invitation;
  return {
    ...invitation,
    loveStory: sections.story ? invitation.loveStory : null,
    galleries: sections.gallery ? invitation.galleries : [],
    giftMethods: sections.gift ? invitation.giftMethods : [],
    wishes: sections.wishes ? invitation.wishes : [],
  };
}
