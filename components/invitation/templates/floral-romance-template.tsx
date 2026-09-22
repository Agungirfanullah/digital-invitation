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
 * Botanical / garden-romance composition — soft rounded containers,
 * script-font accents, restrained line-art ornaments. See the Phase 3
 * design audit §4.2. Every decorative element is purely presentational
 * (`aria-hidden`) and reuses the same shared RSVP/Wishes/Gallery/Gift
 * behavior as every other template.
 */

/** A small, restrained botanical corner flourish — purely decorative. */
function BotanicalFlourish({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 40"
      className={className}
      fill="none"
      stroke="var(--ii-accent)"
      strokeWidth="1.25"
    >
      <path d="M10 30 C 25 10, 45 10, 60 20 C 75 10, 95 10, 110 30" strokeLinecap="round" />
      <circle cx="60" cy="20" r="2.5" fill="var(--ii-accent)" stroke="none" />
      <path d="M40 22 C 44 16, 50 16, 52 20" strokeLinecap="round" />
      <path d="M68 20 C 70 16, 76 16, 80 22" strokeLinecap="round" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-xs font-medium tracking-[0.25em] text-[color:var(--ii-accent)] uppercase">
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
      className="flex min-h-[85vh] flex-col items-center justify-center gap-5 px-6 py-16 text-center"
    >
      <BotanicalFlourish className="h-8 w-28" />
      <p className="text-xs font-medium tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>
      <h1
        className="max-w-md text-3xl text-balance text-[color:var(--ii-primary)] sm:text-4xl"
        style={{ fontFamily: "var(--ii-script-font)" }}
      >
        {coupleOrTitleHeading(invitation)}
      </h1>
      {earliestSchedule && (
        <p className="text-sm text-[color:var(--ii-text)]">
          {formatIndonesianDate(earliestSchedule.date)}
        </p>
      )}
      <div className="mt-4 space-y-1">
        <p className="text-xs tracking-wide text-[color:var(--ii-text)] uppercase opacity-70">
          Kepada Yth.
        </p>
        <p className="text-lg font-medium text-[color:var(--ii-primary)]">
          {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
        </p>
      </div>
      <BotanicalFlourish className="h-8 w-28 rotate-180" />
    </section>
  );
}

function Couple({ profile }: { profile: PublicWeddingProfile }) {
  const bride = profile.brideFullName ?? profile.brideNickname;
  const groom = profile.groomFullName ?? profile.groomNickname;
  if (!bride && !groom) return null;

  return (
    <section aria-labelledby="couple-heading" className="px-6 py-16 text-center">
      <h2 id="couple-heading" className="sr-only">
        Mempelai
      </h2>
      <SectionLabel>Mempelai</SectionLabel>
      <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-12">
        {bride && (
          <div className="rounded-[2rem] border border-[color:var(--ii-secondary)] px-8 py-6">
            <p
              className="text-2xl text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-script-font)" }}
            >
              {bride}
            </p>
            {profile.brideInstagram && (
              <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-70">
                @{profile.brideInstagram}
              </p>
            )}
          </div>
        )}
        {groom && (
          <div className="rounded-[2rem] border border-[color:var(--ii-secondary)] px-8 py-6">
            <p
              className="text-2xl text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-script-font)" }}
            >
              {groom}
            </p>
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
    <section aria-labelledby="schedule-heading" className="px-6 py-16">
      <h2 id="schedule-heading" className="sr-only">
        Rangkaian Acara
      </h2>
      <SectionLabel>Rangkaian Acara</SectionLabel>
      <ol className="mx-auto mt-8 flex max-w-md flex-col gap-6">
        {schedules.map((schedule) => (
          <li
            key={schedule.id}
            className="rounded-[1.5rem] border border-[color:var(--ii-secondary)] bg-[color:var(--ii-secondary)]/30 p-6 text-center"
          >
            <p className="text-lg font-medium text-[color:var(--ii-primary)]">{schedule.title}</p>
            <p className="mt-1 text-sm text-[color:var(--ii-text)]">
              {formatIndonesianDate(schedule.date)}
            </p>
            <p className="text-sm text-[color:var(--ii-text)] opacity-80">
              {formatTimeRange(schedule.startTime, schedule.endTime)}
            </p>
            {schedule.description && (
              <p className="mt-2 text-sm text-[color:var(--ii-text)] opacity-80">
                {schedule.description}
              </p>
            )}
            {schedule.venue && (
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-medium text-[color:var(--ii-primary)]">{schedule.venue.name}</p>
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
          </li>
        ))}
      </ol>
    </section>
  );
}

function LoveStory({ loveStory }: { loveStory: PublicLoveStory | null }) {
  if (!loveStory || loveStory.items.length === 0) return null;

  return (
    <section aria-labelledby="love-story-heading" className="px-6 py-16">
      <h2 id="love-story-heading" className="sr-only">
        {loveStory.title ?? "Kisah Kami"}
      </h2>
      <SectionLabel>{loveStory.title ?? "Kisah Kami"}</SectionLabel>
      <ol className="mx-auto mt-8 flex max-w-md flex-col gap-8">
        {loveStory.items.map((item) => (
          <li key={item.id} className="text-center">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="mx-auto mb-3 h-44 w-44 rounded-full border-4 border-[color:var(--ii-secondary)] object-cover"
              />
            )}
            {item.dateLabel && (
              <p className="text-xs tracking-wide text-[color:var(--ii-accent)] uppercase">
                {item.dateLabel}
              </p>
            )}
            <p className="mt-1 text-lg font-medium text-[color:var(--ii-primary)]">{item.title}</p>
            {item.description && (
              <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-80">
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
    <section aria-labelledby="gallery-heading" className="px-6 py-16">
      <h2 id="gallery-heading" className="sr-only">
        Galeri
      </h2>
      <SectionLabel>Galeri</SectionLabel>
      {nonEmpty.map((gallery, index) => (
        <div key={index} className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-[1.5rem]">
          {gallery.title && (
            <p className="mb-3 text-center font-medium text-[color:var(--ii-primary)]">
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
    <section aria-labelledby="rsvp-heading" className="px-6 py-16">
      <h2 id="rsvp-heading" className="sr-only">
        RSVP
      </h2>
      <SectionLabel>Konfirmasi Kehadiran</SectionLabel>
      <div className="mx-auto mt-8 max-w-md">
        <RsvpSection eventId={eventId} rsvp={rsvp} />
      </div>
    </section>
  );
}

function Gift({ giftMethods }: { giftMethods: PublicGiftMethod[] }) {
  if (giftMethods.length === 0) return null;

  return (
    <section aria-labelledby="gift-heading" className="px-6 py-16">
      <h2 id="gift-heading" className="sr-only">
        Kirim Hadiah
      </h2>
      <SectionLabel>Kirim Hadiah</SectionLabel>
      <div className="mx-auto mt-8 flex max-w-md flex-col gap-4 text-[color:var(--ii-text)]">
        {giftMethods.map((method) => (
          <div
            key={method.id}
            className="rounded-[1.5rem] border border-[color:var(--ii-secondary)] p-6 text-center text-sm"
          >
            <p className="text-xs tracking-wide text-[color:var(--ii-accent)] uppercase">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <p className="mt-1 text-lg font-medium text-[color:var(--ii-primary)]">
              {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            {method.accountName && (
              <p className="mt-2 opacity-90">Atas nama: {method.accountName}</p>
            )}
            {method.accountNumber && (
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
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
                className="mx-auto mt-3 h-44 w-44 rounded-[1rem] object-contain"
              />
            )}
            {method.instructions && (
              <div className="mt-2 flex flex-col items-center gap-2">
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
    <section aria-labelledby="wishes-heading" className="px-6 py-16">
      <h2 id="wishes-heading" className="sr-only">
        Ucapan &amp; Doa
      </h2>
      <SectionLabel>Ucapan &amp; Doa</SectionLabel>
      <div className="mx-auto mt-8 max-w-md space-y-8 text-[color:var(--ii-text)]">
        {guest ? (
          <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
        ) : (
          <p className="rounded-[1.5rem] border border-dashed border-[color:var(--ii-secondary)] p-5 text-center text-sm opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
        {wishes.length > 0 && (
          <ul className="space-y-4">
            {wishes.map((wish) => (
              <li
                key={wish.id}
                className="rounded-[1.5rem] border border-[color:var(--ii-secondary)] p-4 text-center text-sm"
              >
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

function Closing() {
  return (
    <section aria-label="Penutup" className="flex flex-col items-center px-6 py-16 text-center">
      <p className="mx-auto max-w-sm text-sm text-balance text-[color:var(--ii-text)] opacity-80">
        Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan
        hadir dan memberikan doa restu.
      </p>
      <p className="mt-6 text-sm font-medium text-[color:var(--ii-primary)]">
        Terima kasih atas perhatiannya.
      </p>
      <BotanicalFlourish className="mt-6 h-8 w-28" />
    </section>
  );
}

export function FloralRomanceTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
