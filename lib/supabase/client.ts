"use client";

import { createClient } from "@supabase/supabase-js";

import { getClientEnv } from "@/lib/env";

/**
 * Browser-safe Supabase client using the public anon key. Row Level
 * Security policies govern what this client can access.
 *
 * This is the integration boundary for future Supabase Auth session
 * handling on the client; no auth flow is wired up yet.
 */
export function createSupabaseBrowserClient() {
  const env = getClientEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
