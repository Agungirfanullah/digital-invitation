import { z } from "zod";

/**
 * The session cookie is always generated server-side as a `crypto.randomUUID()`
 * value (see `proxy.ts`) — this format check exists because the cookie is
 * still attacker-observable/replayable input (HttpOnly only blocks
 * JavaScript access, not a forged `Cookie` header), so it must be
 * validated like any other externally-supplied string before reaching a
 * query, never trusted merely because it arrived in a cookie.
 */
const sessionIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Sesi tidak valid.");

const boundedIdSchema = z.string().trim().min(1).max(64);

export const deviceTypeSchema = z.enum(["MOBILE", "TABLET", "DESKTOP", "UNKNOWN"]);

export const trackInvitationViewSchema = z.object({
  eventId: boundedIdSchema,
  guestId: boundedIdSchema.nullable(),
  sessionId: sessionIdSchema,
  deviceType: deviceTypeSchema,
  referrer: z.string().trim().max(200).nullable(),
});

export type TrackInvitationViewInput = z.infer<typeof trackInvitationViewSchema>;
