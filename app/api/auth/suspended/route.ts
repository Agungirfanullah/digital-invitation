import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Ends the session of an account an admin suspended (D-107), then shows the
 * login page with an explanation. A route handler, because only here (not
 * in a page render) can the session cookies be cleared; otherwise the login
 * page would see a live session and send the person back to the dashboard.
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login?account=suspended", request.url));
}
