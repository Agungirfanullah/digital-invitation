import "server-only";
import { EventMemberRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const ROLE_RANK: Record<EventMemberRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

/**
 * Resolves an event only if `userId` is authorized to access it at
 * `minRole` or above — either as the event's owner (always full access)
 * or as an `EventMember` whose role meets the bar. There is no UI to add
 * members yet (that lands with team collaboration), but the schema
 * already supports it (`docs/DATABASE.md` §5), so this checks both paths
 * now rather than needing a second authorization pass added later.
 *
 * Returns null for "doesn't exist" and "exists but not authorized" alike
 * — callers must not use this to distinguish the two, since doing so
 * would leak cross-tenant event existence (IDOR).
 */
export async function getAuthorizedEvent(
  eventId: string,
  userId: string,
  minRole: EventMemberRole = EventMemberRole.VIEWER,
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { members: { where: { userId }, select: { role: true } } },
  });

  if (!event) return null;
  if (event.ownerId === userId) return event;

  const membership = event.members[0];
  if (!membership || ROLE_RANK[membership.role] < ROLE_RANK[minRole]) return null;

  return event;
}
