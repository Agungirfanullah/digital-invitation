import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getClientEnv } from "@/lib/env";
import { isProtectedPath } from "@/lib/supabase/route-protection";
import {
  ANALYTICS_SESSION_COOKIE_NAME,
  getAnalyticsSessionCookieOptions,
  isPublicInvitationPath,
} from "@/lib/analytics/session";

/**
 * Refreshes the Supabase auth cookie on every request and blocks
 * unauthenticated access to protected routes at the edge. This is a fast
 * first line of defense (UX-level redirect), not the sole security
 * boundary — every protected Server Component/Action re-verifies the user
 * server-side (see `lib/auth/session.ts`), since a Proxy matcher change or
 * a Server Function on an excluded route would otherwise bypass this check.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = getClientEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Assigns a first-party anonymous analytics session id (never a guest
  // id, never an invitation token, never PII) the first time a visitor
  // hits a public invitation — see docs/DECISIONS.md's Phase 15 entry.
  // Mutating `request.cookies` before rebuilding `response` from it is
  // what makes the newly-set cookie visible to the Server Component
  // render for *this same* request, not just the browser's next one —
  // the same pattern the Supabase block above already relies on.
  if (
    isPublicInvitationPath(request.nextUrl.pathname) &&
    !request.cookies.get(ANALYTICS_SESSION_COOKIE_NAME)
  ) {
    const sessionId = crypto.randomUUID();
    request.cookies.set(ANALYTICS_SESSION_COOKIE_NAME, sessionId);
    response = NextResponse.next({ request });
    response.cookies.set(
      ANALYTICS_SESSION_COOKIE_NAME,
      sessionId,
      getAnalyticsSessionCookieOptions(request.nextUrl.protocol === "https:"),
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
