"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/lib/env";

/**
 * Browser Supabase client using the public anon key, backed by cookies
 * (not localStorage) so the session is visible to server-side code that
 * reads the same cookies via `@/lib/supabase/server`. Row Level Security
 * policies govern what this client can access.
 */
export function createSupabaseBrowserClient() {
  const env = getClientEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
