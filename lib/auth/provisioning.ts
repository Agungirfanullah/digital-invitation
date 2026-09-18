import "server-only";
import type { User as PrismaUser } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export interface SupabaseIdentity {
  id: string;
  email: string;
  name: string;
}

/**
 * Ensures a Prisma `User` row exists for an authenticated Supabase Auth
 * user, using the Supabase user id directly as the Prisma `User.id`. This
 * keeps the two identity systems in a 1:1 mapping without adding a
 * duplicate "external id" column — Supabase Auth owns credentials
 * (passwordHash stays null), Prisma owns application data and the
 * relations later phases hang off `ownerId`/`userId`.
 *
 * Only `email` is refreshed on repeat calls; `name` is set once at
 * creation so a user's in-app display name (once editable) isn't clobbered
 * by their Supabase Auth metadata on every login.
 */
export async function ensureAppUser(identity: SupabaseIdentity): Promise<PrismaUser> {
  return prisma.user.upsert({
    where: { id: identity.id },
    update: { email: identity.email },
    create: { id: identity.id, email: identity.email, name: identity.name },
  });
}
