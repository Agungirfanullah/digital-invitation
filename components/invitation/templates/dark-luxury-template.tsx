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
 * Cinematic / restrained-premium composition — dark surface, generous
 * negative space, one recurring hairline motif as the only decoration.
 * See the Phase 3 design audit §4.3. Deliberately NOT "Minimal Elegant in
 * black" — spacing, letter-spacing, and the hairline-rule idiom are all
 * distinct compositional choices, not a palette swap. Text/background
 * contrast is verified in `lib/invitations/templates/default-themes.test.ts`.
 */

function HairlineRule({ className = "" }: { className?: string }) {
  return (
    <hr aria-hidden="true" className={`border-t border-[color:var(--ii-accent)]/50 ${className}`} />
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-xs font-medium tracking-[0.4em] text-[color:var(--ii-accent)] uppercase">
      {children}
    </p>
  );
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
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-20 text-center"
    >
      <p className="text-xs font-medium tracking-[0.5em] text-[color:var(--ii-accent)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>
      <h1
        className="max-w-2xl text-4xl font-medium tracking-wide text-balance text-[color:var(--ii-primary)] sm:text-6xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {coupleOrTitleHeading(invitation)}
      </h1>
      <HairlineRule className="w-16" />
      {earliestSchedule && (
        <p className="text-sm tracking-widest text-[color:var(--ii-text)] uppercase">
          {formatIndonesianDate(earliestSchedule.date)}
        </p>
      )}
      <div className="mt-8 space-y-1">
        <p className="text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-60">
          Kepada Yth.
        </p>
        <p className="text-lg font-medium tracking-wide text-[color:var(--ii-primary)]">
          {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
        </p>
      </div>
    </section>
  );
}

function Couple({ profile }: { profile: PublicWeddingProfile }) {
  const bride = profile.brideFullName ?? profile.brideNickname;
  const groom = profile.groomFullName ?? profile.groomNickname;
  if (!bride && !groom) return null;

  return (
    <section aria-labelledby="couple-heading" className="px-6 py-24 text-center">
      <h2 id="couple-heading" className="sr-only">
        Mempelai
      </h2>
      <SectionLabel>Mempelai</SectionLabel>
      <div className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-10 sm:flex-row sm:justify-center sm:gap-16">
        {bride && (
          <div>
            <p className="text-2xl font-medium tracking-wide text-[color:var(--ii-primary)]">
              {bride}
            </p>
            {profile.brideInstagram && (
              <p className="mt-2 text-sm text-[color:var(--ii-text)] opacity-60">
                @{profile.brideInstagram}
              </p>
            )}
          </div>
        )}
        {groom && (
          <div>
            <p className="text-2xl font-medium tracking-wide text-[color:var(--ii-primary)]">
              {groom}
            </p>
            {profile.groomInstagram && (
              <p className="mt-2 text-sm text-[color:var(--ii-text)] opacity-60">
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
    <section aria-labelledby="schedule-heading" className="px-6 py-24">
      <h2 id="schedule-heading" className="sr-only">
        Rangkaian Acara
      </h2>
      <SectionLabel>Rangkaian Acara</SectionLabel>
      <div className="mx-auto mt-12 flex max-w-md flex-col gap-12">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="border border-[color:var(--ii-secondary)] p-8 text-center"
          >
            <p className="text-xl font-medium tracking-wide text-[color:var(--ii-primary)]">
              {schedule.title}
            </p>
            <HairlineRule className="mx-auto my-4 w-10" />
            <p className="text-sm tracking-wide text-[color:var(--ii-text)]">
              {formatIndonesianDate(schedule.date)}
            </p>
            <p className="text-sm text-[color:var(--ii-text)] opacity-70">
              {formatTimeRange(schedule.startTime, schedule.endTime)}
            </p>
            {schedule.description && (
              <p className="mt-3 text-sm text-[color:var(--ii-text)] opacity-70">
                {schedule.description}
              </p>
            )}
            {schedule.venue && (
              <div className="mt-4 space-y-1 text-sm">
                <p className="font-medium text-[color:var(--ii-primary)]">{schedule.venue.name}</p>
                <p className="text-[color:var(--ii-text)] opacity-70">{schedule.venue.address}</p>
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
        ))}
      </div>
    </section>
  );
}

function LoveStory({ loveStory }: { loveStory: PublicLoveStory | null }) {
  if (!loveStory || loveStory.items.length === 0) return null;

  return (
    <section aria-labelledby="love-story-heading" className="px-6 py-24">
      <h2 id="love-story-heading" className="sr-only">
        {loveStory.title ?? "Kisah Kami"}
      </h2>
      <SectionLabel>{loveStory.title ?? "Kisah Kami"}</SectionLabel>
      <ol className="mx-auto mt-12 flex max-w-md flex-col gap-10">
        {loveStory.items.map((item) => (
          <li key={item.id} className="text-center">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="mx-auto mb-4 aspect-[4/5] w-48 object-cover"
              />
            )}
            {item.dateLabel && (
              <p className="text-xs tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
                {item.dateLabel}
              </p>
            )}
            <p className="mt-2 text-lg font-medium tracking-wide text-[color:var(--ii-primary)]">
              {item.title}
            </p>
            {item.description && (
              <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-70">
                {item.description}
              </p>
            )}
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
    <section aria-labelledby="gallery-heading" className="px-6 py-24">
      <h2 id="gallery-heading" className="sr-only">
        Galeri
      </h2>
      <SectionLabel>Galeri</SectionLabel>
      {nonEmpty.map((gallery, index) => (
        <div key={index} className="mx-auto mt-12 max-w-xl">
          {gallery.title && (
            <p className="mb-4 text-center text-sm tracking-wide text-[color:var(--ii-primary)]">
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
    <section aria-labelledby="rsvp-heading" className="px-6 py-24">
      <h2 id="rsvp-heading" className="sr-only">
        RSVP
      </h2>
      <SectionLabel>Konfirmasi Kehadiran</SectionLabel>
      <div className="mx-auto mt-10 max-w-md">
        <RsvpSection eventId={eventId} rsvp={rsvp} />
      </div>
    </section>
  );
}

function Gift({ giftMethods }: { giftMethods: PublicGiftMethod[] }) {
  if (giftMethods.length === 0) return null;

  return (
    <section aria-labelledby="gift-heading" className="px-6 py-24">
      <h2 id="gift-heading" className="sr-only">
        Kirim Hadiah
      </h2>
      <SectionLabel>Kirim Hadiah</SectionLabel>
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-6 text-[color:var(--ii-text)]">
        {giftMethods.map((method) => (
          <div
            key={method.id}
            className="border border-[color:var(--ii-secondary)] p-6 text-center text-sm"
          >
            <p className="text-xs tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <p className="mt-2 text-lg font-medium tracking-wide text-[color:var(--ii-primary)]">
              {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            {method.accountName && (
              <p className="mt-2 opacity-80">Atas nama: {method.accountName}</p>
            )}
            {method.accountNumber && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
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
                className="mx-auto mt-4 h-40 w-40 object-contain"
              />
            )}
            {method.instructions && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <p className="whitespace-pre-wrap opacity-80">{method.instructions}</p>
                {method.type === "OTHER" && (
                  <CopyValueButton value={method.instructions} label="Salin Alamat" />
                )}
              </div>
            )}
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
    <section aria-labelledby="wishes-heading" className="px-6 py-24">
      <h2 id="wishes-heading" className="sr-only">
        Ucapan &amp; Doa
      </h2>
      <SectionLabel>Ucapan &amp; Doa</SectionLabel>
      <div className="mx-auto mt-10 max-w-md space-y-8 text-[color:var(--ii-text)]">
        {guest ? (
          <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
        ) : (
          <p className="border border-dashed border-[color:var(--ii-secondary)] p-5 text-center text-sm opacity-70">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
        {wishes.length > 0 && (
          <ul className="space-y-4">
            {wishes.map((wish) => (
              <li
                key={wish.id}
                className="border border-[color:var(--ii-secondary)] p-5 text-center text-sm"
              >
                <p className="whitespace-pre-wrap">{wish.message}</p>
                <p className="mt-3 text-xs tracking-[0.2em] opacity-60">
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

function Closing() {
  return (
    <section
      aria-label="Penutup"
      className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center"
    >
      <p className="mx-auto max-w-lg text-2xl leading-relaxed text-balance text-[color:var(--ii-primary)] sm:text-3xl">
        Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan
        hadir dan memberikan doa restu.
      </p>
      <HairlineRule className="my-8 w-16" />
      <p className="text-xs tracking-[0.4em] text-[color:var(--ii-text)] uppercase opacity-70">
        Terima kasih atas perhatiannya.
      </p>
    </section>
  );
}

export function DarkLuxuryTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
