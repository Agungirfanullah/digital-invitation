import "server-only";

import { prisma } from "@/lib/db/prisma";
import { slugSchema } from "@/lib/events/validation";
import { isEventPubliclyVisible } from "@/lib/invitations/authorization";
import { InvitationNotFoundError } from "@/lib/invitations/errors";
import { PUBLIC_EVENT_INCLUDE, toPublicInvitation } from "@/lib/invitations/projection";
import { resolveGuestContext } from "@/lib/invitations/token";
import type { PublicInvitation } from "@/lib/invitations/types";

/**
 * Resolves a public invitation by slug. Throws `InvitationNotFoundError`
 * for a malformed slug, a nonexistent event, and a real-but-not-public
 * event alike — callers should catch it and call Next's `notFound()`, not
 * inspect it for detail (see `InvitationNotFoundError`'s doc comment).
 *
 * `rawToken` is optional/untrusted `?to=` query input; an invalid or
 * cross-event token silently resolves to no guest context rather than
 * throwing, so an invitation always renders generically for anyone who
 * doesn't have a valid personalized link.
 */
export async function getPublicInvitationBySlug(
  rawSlug: string,
  rawToken?: string | null,
): Promise<PublicInvitation> {
  const parsedSlug = slugSchema.safeParse(rawSlug);
  if (!parsedSlug.success) throw new InvitationNotFoundError();

  const event = await prisma.event.findUnique({
    where: { slug: parsedSlug.data },
    include: PUBLIC_EVENT_INCLUDE,
  });

  if (!event || !isEventPubliclyVisible(event)) {
    throw new InvitationNotFoundError();
  }

  const guest = rawToken ? await resolveGuestContext(event.id, rawToken) : null;

  return toPublicInvitation(event, guest);
}
