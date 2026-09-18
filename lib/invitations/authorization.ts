import type { Event } from "@prisma/client";

/**
 * The single rule for what makes an event publicly viewable: it must be
 * `PUBLISHED`, and if an expiry was set, it must not have passed yet.
 * `Event.status`/`Event.expiresAt` are the existing Phase 0 fields for
 * this — there is no separate "is public" flag to invent or keep in sync.
 */
export function isEventPubliclyVisible(event: Pick<Event, "status" | "expiresAt">): boolean {
  if (event.status !== "PUBLISHED") return false;
  if (event.expiresAt && event.expiresAt.getTime() < Date.now()) return false;
  return true;
}
