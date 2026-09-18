import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User as PrismaUser } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/auth/provisioning";

function deriveName(user: SupabaseUser): string {
  const metadataName = user.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return metadataName.trim();
  }
  return user.email?.split("@")[0] ?? "Pengguna";
}

/**
 * Returns the authenticated Supabase user, or null. Uses `getUser()` (not
 * `getSession()`) because only `getUser()` revalidates the token against
 * Supabase Auth — `getSession()` trusts the local cookie and must never be
 * used for an authorization decision.
 */
export const getSupabaseUser = cache(async (): Promise<SupabaseUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
});

/**
 * Returns the current user's Prisma record, provisioning it on first
 * access. Null if unauthenticated. Wrapped in React `cache()` (like
 * `getSupabaseUser`) so a layout and its nested pages calling this in the
 * same request share one Supabase round trip and one Prisma upsert instead
 * of repeating both per segment.
 */
export const getCurrentAppUser = cache(async (): Promise<PrismaUser | null> => {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser?.email) return null;

  return ensureAppUser({
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: deriveName(supabaseUser),
  });
});

/** Redirects to /login when unauthenticated. Use in protected Server Components/layouts. */
export async function requireAppUser(): Promise<PrismaUser> {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");
  return user;
}
