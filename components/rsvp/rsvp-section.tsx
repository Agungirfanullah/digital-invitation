import type { RsvpGuestView } from "@/lib/rsvp/types";
import { RsvpForm } from "@/components/rsvp/rsvp-form";

export interface RsvpSectionProps {
  eventId: string;
  /** Present only for a valid, same-event, personalized guest — see lib/rsvp/service.ts's getRsvpGuestView(). */
  rsvp: { token: string; view: RsvpGuestView } | null;
}

/**
 * A public visitor without a valid personalized token can see this
 * section but never submits a guest-specific RSVP through it — there is
 * no guest identity to attach an answer to, and the underlying Server
 * Action independently re-verifies the token regardless of what this
 * component renders.
 */
export function RsvpSection({ eventId, rsvp }: RsvpSectionProps) {
  return (
    <section aria-labelledby="rsvp-heading" className="px-6 py-16">
      <h2
        id="rsvp-heading"
        className="mb-8 text-center text-xs font-medium tracking-[0.3em] text-[color:var(--ii-accent)] uppercase"
      >
        RSVP
      </h2>

      <div className="mx-auto max-w-md text-[color:var(--ii-text)]">
        {rsvp ? (
          <RsvpForm
            eventId={eventId}
            token={rsvp.token}
            guestName={rsvp.view.guestName}
            seatQuota={rsvp.view.seatQuota}
            existing={rsvp.view.existing}
          />
        ) : (
          <p className="rounded-lg border border-dashed p-5 text-center text-sm opacity-80">
            RSVP hanya dapat diisi melalui tautan undangan pribadi Anda.
          </p>
        )}
      </div>
    </section>
  );
}
