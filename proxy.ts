import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getClientEnv } from "@/lib/env";
import { isProtectedPath } from "@/lib/supabase/route-protection";
import {
  ANALYTICS_SESSION_COOKIE_NAME,
  getAnalyticsSessionCookieOptions,
  isPublicInvitationPath,
} from "@/lib/analytics/session";
import { buildNonce, getSecurityHeaders } from "@/lib/security/headers";

/**
 * Refreshes the Supabase auth cookie on every request and blocks
 * unauthenticated access to protected routes at the edge. This is a fast
 * first line of defense (UX-level redirect), not the sole security
 * boundary — every protected Server Component/Action re-verifies the user
 * server-side (see `lib/auth/session.ts`), since a Proxy matcher change or
 * a Server Function on an excluded route would otherwise bypass this check.
 */
export async function proxy(request: NextRequest) {
  // Generated once per request, mutated onto `request.headers` in place —
  // the same "mutate the shared request object before the first
  // NextResponse.next({ request })" idiom the cookie logic below already
  // relies on, so every subsequent NextResponse.next({ request }) call in
  // this function carries it through to the Server Component render
  // without restructuring those calls. Next.js reads it back out of the
  // Content-Security-Policy response header at render time to nonce its
  // own injected scripts — see lib/security/headers.ts.
  const nonce = buildNonce();
  request.headers.set("x-nonce", nonce);

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
    response = NextResponse.redirect(redirectUrl);
  } else if (
    // Assigns a first-party anonymous analytics session id (never a guest
    // id, never an invitation token, never PII) the first time a visitor
    // hits a public invitation — see docs/DECISIONS.md's Phase 15 entry.
    // Mutating `request.cookies` before rebuilding `response` from it is
    // what makes the newly-set cookie visible to the Server Component
    // render for *this same* request, not just the browser's next one —
    // the same pattern the Supabase block above already relies on.
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

  // Applied last, after every branch above has finished reassigning
  // `response` — so these headers always land on the response actually
  // returned, regardless of which branches ran for this request.
  const isHttps = request.nextUrl.protocol === "https:";
  const isDev = process.env.NODE_ENV === "development";
  for (const [key, value] of getSecurityHeaders({ nonce, isDev, isHttps })) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
