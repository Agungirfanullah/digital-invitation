"use server";

import { RSVP_RATE_LIMIT_MESSAGE, mapRsvpErrorMessage } from "@/lib/rsvp/errors";
import { checkRsvpRateLimit } from "@/lib/rsvp/rate-limit";
import { submitRsvpForGuest } from "@/lib/rsvp/service";
import { rsvpFormSchema } from "@/lib/rsvp/validation";
import type { RsvpFormState } from "@/lib/rsvp/types";

/**
 * Public, unauthenticated Server Action — reachable by anyone who knows
 * an `eventId` and can guess/replay a token, so it independently
 * re-validates and re-resolves everything itself. `eventId` and `token`
 * are bound server-side by the caller (the invitation page, from the
 * already-resolved slug and the `?to=` query value) — this action never
 * accepts a guestId, and never trusts anything else from the client for
 * identity.
 */
export async function submitRsvpAction(
  eventId: string,
  token: string,
  _prevState: RsvpFormState,
  formData: FormData,
): Promise<RsvpFormState> {
  if (!(await checkRsvpRateLimit())) {
    return { status: "error", error: RSVP_RATE_LIMIT_MESSAGE };
  }

  const parsed = rsvpFormSchema.safeParse({
    attendance: formData.get("attendance"),
    attendeeCount: formData.get("attendeeCount") || "0",
    message: formData.get("message") || null,
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: "Periksa kembali jawaban RSVP Anda.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const data = await submitRsvpForGuest(eventId, token, parsed.data);
    return { status: "success", data };
  } catch (error) {
    return { status: "error", error: mapRsvpErrorMessage(error) };
  }
}
