import type { InvitationTemplateProps } from "@/lib/invitations/templates/registry";
import type {
  PublicGallery,
  PublicGiftMethod,
  PublicInvitation,
  PublicLoveStory,
  PublicSchedule,
  PublicWeddingProfile,
  PublicWish,
} from "@/lib/invitations/types";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { GIFT_METHOD_TYPE_LABELS } from "@/lib/gifts/labels";
import {
  formatIndonesianDate,
  formatIndonesianDateTime,
  formatTimeRange,
} from "@/lib/invitations/format";
import { themeToCssVars } from "@/components/invitation/theme-vars";
import { GalleryGrid } from "@/components/invitation/sections/gallery-grid";
import { RsvpSection } from "@/components/rsvp/rsvp-section";
import { WishForm } from "@/components/wishes/wish-form";
import { CopyValueButton } from "@/components/gifts/copy-value-button";
import type { RsvpGuestView } from "@/lib/rsvp/types";

/**
 * Editorial / fashion-magazine composition — asymmetric, rule-divided,
 * numbered, typography-led. See docs/DECISIONS.md and the Phase 3 design
 * audit's §4.1 for the full brief. Reuses every shared behavior (RSVP,
 * Wishes, Gallery/lightbox, Gift copy) exactly as Minimal Elegant does —
 * only the surrounding markup differs.
 */
function Eyebrow({ index, children }: { index?: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.35em] text-[color:var(--ii-accent)] uppercase">
      {index && <span className="text-[color:var(--ii-primary)]">{index}</span>}
      {children}
    </p>
  );
}

function Rule() {
  return <hr className="border-t border-[color:var(--ii-secondary)]" />;
}

function coupleOrTitleHeading(invitation: PublicInvitation): string {
  const profile = invitation.weddingProfile;
  if (profile?.groomNickname && profile?.brideNickname) {
    return `${profile.brideNickname} & ${profile.groomNickname}`;
  }
  if (profile?.groomFullName && profile?.brideFullName) {
    return `${profile.brideFullName} & ${profile.groomFullName}`;
  }
  return invitation.title;
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const earliestSchedule = invitation.schedules[0];

  return (
    <section
      aria-label="Sampul undangan"
      className="mx-auto flex min-h-[85vh] max-w-5xl flex-col justify-center gap-6 px-6 py-20 sm:px-10"
    >
      <Eyebrow>{EVENT_TYPE_LABELS[invitation.type]}</Eyebrow>
      <h1
        className="max-w-3xl text-5xl leading-[1.05] font-semibold text-balance text-[color:var(--ii-primary)] sm:text-7xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {coupleOrTitleHeading(invitation)}
      </h1>
      <Rule />
      <div className="flex flex-wrap items-end justify-between gap-4">
        {earliestSchedule && (
          <p className="text-sm tracking-wide text-[color:var(--ii-text)]">
            {formatIndonesianDate(earliestSchedule.date)}
          </p>
        )}
        <div className="text-left sm:text-right">
          <p className="text-xs tracking-wide text-[color:var(--ii-text)] uppercase opacity-70">
            Kepada Yth.
          </p>
          <p className="text-lg font-medium text-[color:var(--ii-primary)]">
            {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
          </p>
        </div>
      </div>
    </section>
  );
}

function Couple({ profile }: { profile: PublicWeddingProfile }) {
  const bride = profile.brideFullName ?? profile.brideNickname;
  const groom = profile.groomFullName ?? profile.groomNickname;
  if (!bride && !groom) return null;

  return (
    <section aria-labelledby="couple-heading" className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
      <Eyebrow index="01">Mempelai</Eyebrow>
      <h2 id="couple-heading" className="sr-only">
        Mempelai
      </h2>
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        {bride && (
          <div>
            <p className="text-3xl font-medium text-[color:var(--ii-primary)]">{bride}</p>
            {profile.brideInstagram && (
              <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-70">
                @{profile.brideInstagram}
              </p>
            )}
          </div>
        )}
        {groom && (
          <div className="sm:text-right">
            <p className="text-3xl font-medium text-[color:var(--ii-primary)]">{groom}</p>
            {profile.groomInstagram && (
              <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-70">
                @{profile.groomInstagram}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Schedule({ schedules }: { schedules: PublicSchedule[] }) {
  if (schedules.length === 0) return null;

  return (
    <section aria-labelledby="schedule-heading" className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
      <Eyebrow index="02">Rangkaian Acara</Eyebrow>
      <h2 id="schedule-heading" className="sr-only">
        Rangkaian Acara
      </h2>
      <ol className="mt-8 divide-y divide-[color:var(--ii-secondary)]">
        {schedules.map((schedule, index) => (
          <li key={schedule.id} className="grid gap-2 py-6 sm:grid-cols-[1fr_2fr] sm:gap-8">
            <p className="text-xs tracking-widest text-[color:var(--ii-accent)] uppercase">
              {String(index + 1).padStart(2, "0")} — {formatIndonesianDate(schedule.date)}
            </p>
            <div>
              <p className="text-xl font-medium text-[color:var(--ii-primary)]">{schedule.title}</p>
              <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-80">
                {formatTimeRange(schedule.startTime, schedule.endTime)}
              </p>
              {schedule.description && (
                <p className="mt-2 text-sm text-[color:var(--ii-text)] opacity-80">
                  {schedule.description}
                </p>
              )}
              {schedule.venue && (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-medium text-[color:var(--ii-primary)]">
                    {schedule.venue.name}
                  </p>
                  <p className="text-[color:var(--ii-text)] opacity-80">{schedule.venue.address}</p>
                  {schedule.venue.mapUrl && (
                    <a
                      href={schedule.venue.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[color:var(--ii-accent)] underline underline-offset-4"
                    >
                      Buka Peta
                    </a>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function LoveStory({ loveStory }: { loveStory: PublicLoveStory | null }) {
  if (!loveStory || loveStory.items.length === 0) return null;

  return (
    <section aria-labelledby="love-story-heading" className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
      <Eyebrow index="03">{loveStory.title ?? "Kisah Kami"}</Eyebrow>
      <h2 id="love-story-heading" className="sr-only">
        {loveStory.title ?? "Kisah Kami"}
      </h2>
      <ol className="mt-8 grid gap-10 sm:grid-cols-2">
        {loveStory.items.map((item, index) => (
          <li key={item.id} className="grid grid-cols-[auto_1fr] gap-4">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="h-28 w-24 flex-none object-cover"
              />
            )}
            <div>
              <p className="text-xs tracking-widest text-[color:var(--ii-accent)] uppercase">
                {String(index + 1).padStart(2, "0")}
                {item.dateLabel && ` — ${item.dateLabel}`}
              </p>
              <p className="mt-1 text-lg font-medium text-[color:var(--ii-primary)]">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-80">
                  {item.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Gallery({ galleries }: { galleries: PublicGallery[] }) {
  const nonEmpty = galleries.filter((g) => g.items.length > 0);
  if (nonEmpty.length === 0) return null;

  return (
    <section aria-labelledby="gallery-heading" className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
      <Eyebrow index="04">Galeri</Eyebrow>
      <h2 id="gallery-heading" className="sr-only">
        Galeri
      </h2>
      {nonEmpty.map((gallery, index) => (
        <div key={index} className="mt-8 first:mt-8">
          {gallery.title && (
            <p className="mb-3 text-sm font-medium text-[color:var(--ii-primary)]">
              {gallery.title}
            </p>
          )}
          <GalleryGrid items={gallery.items} />
        </div>
      ))}
    </section>
  );
}

function Rsvp({
  eventId,
  rsvp,
}: {
  eventId: string;
  rsvp: { token: string; view: RsvpGuestView } | null;
}) {
  return (
    <section aria-labelledby="rsvp-heading" className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
      <Eyebrow index="05">Konfirmasi Kehadiran</Eyebrow>
      <h2 id="rsvp-heading" className="sr-only">
        RSVP
      </h2>
      <div className="mt-8 max-w-lg">
        <RsvpSection eventId={eventId} rsvp={rsvp} />
      </div>
    </section>
  );
}

function Gift({ giftMethods }: { giftMethods: PublicGiftMethod[] }) {
  if (giftMethods.length === 0) return null;

  return (
    <section aria-labelledby="gift-heading" className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
      <Eyebrow index="06">Kirim Hadiah</Eyebrow>
      <h2 id="gift-heading" className="sr-only">
        Kirim Hadiah
      </h2>
      <div className="mt-8 divide-y divide-[color:var(--ii-secondary)]">
        {giftMethods.map((method) => (
          <div key={method.id} className="grid gap-2 py-5 sm:grid-cols-[1fr_2fr] sm:gap-8">
            <p className="text-xs tracking-widest text-[color:var(--ii-accent)] uppercase">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <div className="text-sm text-[color:var(--ii-text)]">
              <p className="text-lg font-medium text-[color:var(--ii-primary)]">
                {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
              </p>
              {method.accountName && (
                <p className="mt-1 opacity-90">Atas nama: {method.accountName}</p>
              )}
              {method.accountNumber && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono">{method.accountNumber}</span>
                  <CopyValueButton value={method.accountNumber} label="Salin Nomor" />
                </div>
              )}
              {method.qrImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
                <img
                  src={method.qrImageUrl}
                  alt={`Kode QR ${method.providerName ?? "hadiah"}`}
                  loading="lazy"
                  className="mt-3 h-40 w-40 object-contain"
                />
              )}
              {method.instructions && (
                <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap opacity-80">{method.instructions}</p>
                  {method.type === "OTHER" && (
                    <CopyValueButton value={method.instructions} label="Salin Alamat" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Wishes({
  eventId,
  wishes,
  guest,
}: {
  eventId: string;
  wishes: PublicWish[];
  guest: { token: string; guestName: string } | null;
}) {
  return (
    <section aria-labelledby="wishes-heading" className="mx-auto max-w-5xl px-6 py-16 sm:px-10">
      <Eyebrow index="07">Ucapan &amp; Doa</Eyebrow>
      <h2 id="wishes-heading" className="sr-only">
        Ucapan &amp; Doa
      </h2>
      <div className="mt-8 max-w-lg">
        {guest ? (
          <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
        ) : (
          <p className="text-sm text-[color:var(--ii-text)] opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
      </div>
      {wishes.length > 0 && (
        <ul className="mt-10 divide-y divide-[color:var(--ii-secondary)]">
          {wishes.map((wish) => (
            <li key={wish.id} className="py-4 text-sm text-[color:var(--ii-text)]">
              <p className="whitespace-pre-wrap">{wish.message}</p>
              <p className="mt-2 text-xs tracking-wide opacity-70">
                {wish.name} · {formatIndonesianDateTime(wish.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Closing() {
  return (
    <section aria-label="Penutup" className="mx-auto max-w-5xl px-6 py-24 sm:px-10">
      <Rule />
      <p className="mt-10 max-w-2xl text-3xl leading-tight font-medium text-balance text-[color:var(--ii-primary)] sm:text-4xl">
        Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan
        hadir dan memberikan doa restu.
      </p>
      <p className="mt-6 text-sm tracking-widest text-[color:var(--ii-text)] uppercase opacity-70">
        Terima kasih atas perhatiannya.
      </p>
    </section>
  );
}

export function ModernEditorialTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
  return (
    <main
      style={themeToCssVars(invitation.theme)}
      className="min-h-screen bg-[color:var(--ii-background)]"
    >
      <div style={{ fontFamily: "var(--ii-body-font)" }}>
        <Hero invitation={invitation} />
        {invitation.weddingProfile && <Couple profile={invitation.weddingProfile} />}
        <Schedule schedules={invitation.schedules} />
        <LoveStory loveStory={invitation.loveStory} />
        <Gallery galleries={invitation.galleries} />
        <Rsvp eventId={invitation.eventId} rsvp={rsvp ?? null} />
        <Gift giftMethods={invitation.giftMethods} />
        <Wishes eventId={invitation.eventId} wishes={invitation.wishes} guest={wishGuest ?? null} />
        <Closing />
      </div>
    </main>
  );
}
