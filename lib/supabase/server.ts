import "server-only";
import { createClient } from "@supabase/supabase-js";

import { getClientEnv, getServerEnv } from "@/lib/env";

/**
 * Server-only Supabase client using the service role key. Has elevated
 * privileges (bypasses Row Level Security) — never import this from client
 * code and never forward the service role key to the browser.
 *
 * This is the integration boundary for Supabase Storage/Auth server-side
 * operations. No upload/auth business logic is implemented yet; that is
 * added in the roadmap phase that needs it.
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
