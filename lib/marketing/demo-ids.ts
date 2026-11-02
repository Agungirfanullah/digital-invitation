/**
 * The event id of the fabricated demo invitation (`buildDemoInvitation`).
 * Kept out of the `server-only` demo module so client components can tell
 * a demo apart, e.g. to show the RSVP form as a sample that cannot be sent.
 * Real events have cuid ids, so they never match.
 */
export const DEMO_INVITATION_EVENT_ID = "demo-invitation";

export function isDemoInvitation(eventId: string): boolean {
  return eventId === DEMO_INVITATION_EVENT_ID;
}
