import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSafeRedirectPath } from "@/lib/auth/urls";

/**
 * Exchanges a Supabase Auth PKCE `code` for a session. Reached via the link
 * in confirmation/password-reset emails (and future OAuth providers), then
 * redirects to `next` (defaulting to /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next = isSafeRedirectPath(nextParam) ? nextParam : "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", "callback_failed");
  return NextResponse.redirect(errorUrl);
}
