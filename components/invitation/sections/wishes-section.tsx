import type { PublicWish } from "@/lib/invitations/types";
import { formatIndonesianDateTime } from "@/lib/invitations/format";
import { WishForm } from "@/components/wishes/wish-form";
import { SectionHeading } from "@/components/invitation/sections/section-heading";

export interface WishesSectionProps {
  eventId: string;
  wishes: PublicWish[];
  /** Present only for a valid, same-event, personalized guest — see app/invite/[slug]/page.tsx. */
  guest: { token: string; guestName: string } | null;
}

/**
 * Approved wishes are always fetched as part of `PublicInvitation` (like
 * galleries/gift methods — docs/DECISIONS.md D-039), so this section shows
 * them regardless of whether the current visitor can submit one. The
 * submission form itself is only offered to a personalized visitor (a
 * resolved guest token) — mirrors `RsvpSection` exactly: a public visitor
 * without a token sees an explanatory note instead of a submittable form,
 * since `Wish.guestId` is a required column with no anonymous identity to
 * attach a submission to. That note is genuine, truthful content (why
 * there's no form here), not a placeholder, so — like `RsvpSection` — the
 * section always renders rather than hiding itself while there happen to
 * be zero approved wishes yet (CLAUDE.md §1.5/§9.1 concern "fake/empty
 * section" content, not an honest explanation of real behavior).
 */
export function WishesSection({ eventId, wishes, guest }: WishesSectionProps) {
  return (
    <section aria-labelledby="wishes-heading" className="px-8 py-20">
      <div className="mx-auto max-w-md space-y-8 text-[color:var(--ii-text)]">
        <SectionHeading id="wishes-heading">Ucapan &amp; Doa</SectionHeading>
        {guest ? (
          <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
        ) : (
          <p className="border-l border-[color:var(--ii-accent)] py-1 pl-4 text-sm opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}

        {wishes.length > 0 && (
          <ul className="divide-y divide-[color:var(--ii-secondary)] border-y border-[color:var(--ii-secondary)]">
            {wishes.map((wish) => (
              <li key={wish.id} className="py-5 text-sm">
                <p className="whitespace-pre-wrap">{wish.message}</p>
                <p className="mt-2 text-xs tracking-wide opacity-70">
                  {wish.name} · {formatIndonesianDateTime(wish.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
