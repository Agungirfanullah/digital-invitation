import { NextResponse } from "next/server";

import { requireAppUser } from "@/lib/auth/session";
import { exportRsvpToCsv } from "@/lib/rsvp/service";
import { EventNotFoundError } from "@/lib/rsvp/errors";

/**
 * Downloads the event's RSVP responses as CSV. A GET route (not a Server
 * Action) because it needs to return a file response; authorization is
 * re-checked here exactly like the dashboard read itself (VIEWER-and-
 * above, matching `lib/guests/service.ts`'s `exportGuestsToCsv`
 * precedent) — never inferred from the fact that the link was reachable
 * in the UI.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const user = await requireAppUser();

  try {
    const { filename, csv } = await exportRsvpToCsv(eventId, user.id);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof EventNotFoundError) {
      return NextResponse.json({ error: "Acara tidak ditemukan." }, { status: 404 });
    }
    throw error;
  }
}
