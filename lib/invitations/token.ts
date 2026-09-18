import "server-only";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import type { PublicGuestContext } from "@/lib/invitations/types";

/**
 * Format check only — real tokens are opaque, DB-generated identifiers.
 * This just rejects obviously-malformed input before it reaches a query.
 */
export const guestTokenSchema = z
  .string()
  .trim()
  .min(10, "Token tidak valid.")
  .max(128, "Token tidak valid.")
  .regex(/^[A-Za-z0-9_-]+$/, "Token tidak valid.");

/**
 * Resolves a `?to=` token to a guest display name, scoped to `eventId`.
 * Returns null for anything that doesn't check out — malformed format,
 * unknown token, or (critically) a token that belongs to a *different*
 * event — so the caller can fall back to a generic invitation rather than
 * erroring.
 *
 * The event scope check is derived from `GuestInvitation → Guest → Event`
 * (both hops are enforced foreign keys) rather than trusting
 * `GuestInvitation.eventId` directly, even though that column is now also
 * FK-constrained (see docs/DECISIONS.md D-020) — belt-and-suspenders
 * against a token for Event A ever personalizing Event B.
 */
export async function resolveGuestContext(
  eventId: string,
  rawToken: unknown,
): Promise<PublicGuestContext | null> {
  const parsed = guestTokenSchema.safeParse(rawToken);
  if (!parsed.success) return null;

  const invitation = await prisma.guestInvitation.findUnique({
    where: { token: parsed.data },
    select: {
      guest: { select: { name: true, eventId: true } },
    },
  });

  if (!invitation?.guest) return null;
  if (invitation.guest.eventId !== eventId) return null;

  return { displayName: invitation.guest.name };
}
