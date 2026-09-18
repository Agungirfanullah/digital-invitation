import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { getClientEnv, getServerEnv } from "@/lib/env";

/**
 * Request-scoped Supabase client using the public anon key, backed by the
 * Next.js cookie jar. Use this for all auth-aware server-side reads/writes
 * (Server Components, Server Actions, Route Handlers) — Row Level Security
 * still applies. Call `auth.getUser()` (not `getSession()`) when the result
 * is used for an authorization decision, since only `getUser()` revalidates
 * the token against Supabase Auth instead of trusting the local cookie.
 */
export async function createSupabaseServerClient() {
  const env = getClientEnv();
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render, where cookies are
          // read-only. The session is still refreshed by proxy.ts on the
          // next request, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Server-only Supabase client using the service role key. Has elevated
 * privileges (bypasses Row Level Security) — never import this from client
 * code and never forward the service role key to the browser.
 *
 * This is the integration boundary for Supabase Storage/admin server-side
 * operations. No upload business logic is implemented yet; that is added
 * in the roadmap phase that needs it.
 */
export function createSupabaseServiceClient() {
  const client = getClientEnv();
  const server = getServerEnv();

  return createClient(client.NEXT_PUBLIC_SUPABASE_URL, server.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
