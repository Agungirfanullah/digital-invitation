import { isDemoInvitation } from "@/lib/marketing/demo-ids";
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
 *
 * The demo invitation shows the real form as a sample that cannot be sent
 * (D-098), so visitors see what their guests will fill in.
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
        ) : isDemoInvitation(eventId) ? (
          <RsvpForm
            demo
            eventId={eventId}
            token=""
            guestName="Tamu Undangan"
            seatQuota={2}
            existing={null}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-[var(--ii-radius,0.75rem)] border border-dashed border-[color:var(--ii-accent)]/50 px-6 py-7 text-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-7 text-[color:var(--ii-accent)]"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <p className="text-sm opacity-80">
              RSVP hanya dapat diisi melalui tautan undangan pribadi Anda.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
