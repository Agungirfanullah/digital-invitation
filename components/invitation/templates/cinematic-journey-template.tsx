import { Fragment, type ReactNode } from "react";
import type { InvitationTemplateProps } from "@/lib/invitations/templates/registry";
import type { InvitationSectionKey } from "@/lib/event-types/sections";
import { CountdownSection } from "@/components/invitation/sections/countdown-section";
import {
  CoverPhotoLayer,
  coverPhotoTextStyle,
} from "@/components/invitation/sections/cover-photo-background";
import type {
  PublicGallery,
  PublicGiftMethod,
  PublicIdentity,
  PublicInvitation,
  PublicLoveStory,
  PublicSchedule,
  PublicWish,
} from "@/lib/invitations/types";
import { getInvitationCopy, type InvitationCopy } from "@/lib/event-types/config";
import { getHeroHeading, getHeroScheduleDate } from "@/lib/event-types/identity";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { GIFT_METHOD_TYPE_LABELS } from "@/lib/gifts/labels";
import {
  buildGoogleCalendarUrl,
  formatIndonesianDate,
  formatIndonesianDateTime,
  formatTimeRange,
  toInstagramProfileUrl,
} from "@/lib/invitations/format";
import { themeToCssVars } from "@/components/invitation/theme-vars";
import { GalleryGrid } from "@/components/invitation/sections/gallery-grid";
import { RsvpSection } from "@/components/rsvp/rsvp-section";
import { WishForm } from "@/components/wishes/wish-form";
import { CopyValueButton } from "@/components/gifts/copy-value-button";
import type { RsvpGuestView } from "@/lib/rsvp/types";

/**
 * Editorial/cinematic composition — bottom-anchored full-bleed hero text
 * (a movie-poster idiom, not centered like every other template here),
 * large thin "chapter" numerals marking Love Story entries, and a
 * film-frame double-rule border around the gallery. Deliberately not a
 * recolor of Modern Editorial or Dark Luxury: the bottom-anchored hero,
 * numbered-chapter idiom, and film-frame motif are distinct compositional
 * choices of their own. Text/background contrast is verified in
 * `lib/invitations/templates/default-themes.test.ts`.
 */

function ChapterNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="block text-5xl leading-none font-light text-[color:var(--ii-accent)]/40"
      style={{ fontFamily: "var(--ii-heading-font)" }}
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-xs font-medium tracking-[0.35em] text-[color:var(--ii-accent)] uppercase">
      {children}
    </p>
  );
}

/** A vertical strip of small sprocket-hole squares, run down each edge of the Hero — a 35mm film-strip detail, complementing (not replacing) the chapter-number idiom. */
function FilmSprockets({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col justify-between py-10 ${className}`} aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="size-2 rounded-[2px] opacity-50"
          style={{ backgroundColor: "var(--ii-accent)" }}
        />
      ))}
    </div>
  );
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;

  return (
    <section
      aria-label="Sampul undangan"
      className="relative flex min-h-screen flex-col items-center justify-end gap-4 px-6 pt-20 pb-16 text-center"
      style={coverPhotoTextStyle(coverPhotoUrl)}
    >
      <CoverPhotoLayer imageUrl={coverPhotoUrl} />
      <FilmSprockets className="absolute top-0 bottom-0 left-2" />
      <FilmSprockets className="absolute top-0 right-2 bottom-0" />
      <p className="relative text-xs font-medium tracking-[0.5em] text-[color:var(--ii-accent)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>
      <h1
        className="relative max-w-2xl text-5xl font-medium text-balance text-[color:var(--ii-primary)] sm:text-7xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {getHeroHeading(invitation)}
      </h1>
      {heroDate && (
        <p className="relative text-sm tracking-widest text-[color:var(--ii-text)] uppercase">
          {formatIndonesianDate(heroDate)}
        </p>
      )}
      <div className="relative mt-6 space-y-1">
        <p className="text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-60">
          Kepada Yth.
        </p>
        <p className="text-lg font-medium text-[color:var(--ii-primary)]">
          {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
        </p>
      </div>
    </section>
  );
}

function Identity({ identity }: { identity: PublicIdentity }) {
  return (
    <section aria-labelledby="identity-heading" className="px-6 py-24 text-center">
      <h2 id="identity-heading" className="sr-only">
        {identity.heading}
      </h2>
      <SectionLabel>{identity.heading}</SectionLabel>
      {identity.members.length > 0 && (
        <div className="mx-auto mt-10 flex max-w-lg flex-col items-center divide-y divide-[color:var(--ii-secondary)] sm:flex-row sm:divide-x sm:divide-y-0">
          {identity.members.map((member, index) => (
            <div key={`${index}-${member.name}`} className="px-8 py-6">
              <p
                className="text-3xl font-medium text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {member.name}
              </p>
              {member.instagram && (
                <a
                  href={toInstagramProfileUrl(member.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-[color:var(--ii-text)] underline-offset-2 opacity-60 hover:underline"
                >
                  @{member.instagram}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {identity.details.length > 0 && (
        <ul className="mx-auto mt-8 max-w-md space-y-2 text-sm tracking-wide text-[color:var(--ii-text)] opacity-70">
          {identity.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
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
      <div className="mx-auto mt-12 flex max-w-2xl flex-col gap-0 divide-y divide-[color:var(--ii-secondary)]">
        {schedules.map((schedule, index) => (
          <div key={schedule.id} className="flex gap-6 py-8 text-left">
            <ChapterNumber n={index + 1} />
            <div className="flex-1">
              <p
                className="text-xl font-medium text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {schedule.title}
              </p>
              <p className="mt-1 text-sm tracking-wide text-[color:var(--ii-text)]">
                {formatIndonesianDate(schedule.date)} ·{" "}
                {formatTimeRange(schedule.startTime, schedule.endTime)}
              </p>
              {schedule.description && (
                <p className="mt-2 text-sm text-[color:var(--ii-text)] opacity-70">
                  {schedule.description}
                </p>
              )}
              {schedule.venue && (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="font-medium text-[color:var(--ii-primary)]">
                    {schedule.venue.name}
                  </p>
                  <p className="text-[color:var(--ii-text)] opacity-70">{schedule.venue.address}</p>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <a
                  href={buildGoogleCalendarUrl(schedule)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[color:var(--ii-accent)] underline underline-offset-4"
                >
                  Simpan Tanggal
                </a>
                {schedule.venue?.mapUrl && (
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
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LoveStory({
  loveStory,
  defaultTitle,
}: {
  loveStory: PublicLoveStory | null;
  defaultTitle: string;
}) {
  if (!loveStory || loveStory.items.length === 0) return null;

  return (
    <section aria-labelledby="love-story-heading" className="px-6 py-24">
      <h2 id="love-story-heading" className="sr-only">
        {loveStory.title ?? defaultTitle}
      </h2>
      <SectionLabel>{loveStory.title ?? defaultTitle}</SectionLabel>
      <ol className="mx-auto mt-12 flex max-w-2xl flex-col gap-12">
        {loveStory.items.map((item, index) => (
          <li key={item.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <ChapterNumber n={index + 1} />
            {item.imageUrl && (
              <div className="border-2 border-[color:var(--ii-accent)]/40 p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL. */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="aspect-[4/5] w-40 object-cover"
                />
              </div>
            )}
            <div className="text-left">
              {item.dateLabel && (
                <p className="text-xs tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
                  {item.dateLabel}
                </p>
              )}
              <p
                className="mt-1 text-xl font-medium text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-70">
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
    <section aria-labelledby="gallery-heading" className="px-6 py-24">
      <h2 id="gallery-heading" className="sr-only">
        Galeri
      </h2>
      <SectionLabel>Galeri</SectionLabel>
      {nonEmpty.map((gallery, index) => (
        <div
          key={index}
          className="mx-auto mt-12 max-w-xl border-x-2 border-double border-[color:var(--ii-accent)]/50 px-4 py-6"
        >
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
            <p
              className="mt-2 text-lg font-medium text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
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

function Closing({ copy }: { copy: InvitationCopy }) {
  return (
    <section
      aria-label="Penutup"
      className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center"
    >
      <p
        className="mx-auto max-w-lg text-2xl leading-relaxed text-balance text-[color:var(--ii-primary)] sm:text-3xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {copy.closingMessage}
      </p>
      <p className="mt-8 text-xs tracking-[0.4em] text-[color:var(--ii-text)] uppercase opacity-70">
        {copy.closingThanks}
      </p>
    </section>
  );
}

export function CinematicJourneyTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
  const { sections } = invitation;
  const copy = getInvitationCopy(invitation.type);

  const sectionRenderers: Record<InvitationSectionKey, ReactNode> = {
    hero: sections.hero && <Hero invitation={invitation} />,
    identity: sections.identity && invitation.identity && (
      <Identity identity={invitation.identity} />
    ),
    countdown: sections.countdown && <CountdownSection invitation={invitation} />,
    schedule: sections.schedule && <Schedule schedules={invitation.schedules} />,
    story: <LoveStory loveStory={invitation.loveStory} defaultTitle={copy.storyDefaultTitle} />,
    gallery: <Gallery galleries={invitation.galleries} />,
    rsvp: sections.rsvp && <Rsvp eventId={invitation.eventId} rsvp={rsvp ?? null} />,
    gift: <Gift giftMethods={invitation.giftMethods} />,
    wishes: sections.wishes && (
      <Wishes eventId={invitation.eventId} wishes={invitation.wishes} guest={wishGuest ?? null} />
    ),
  };

  return (
    <main
      style={themeToCssVars(invitation.theme)}
      className="min-h-screen bg-[color:var(--ii-background)]"
    >
      <div style={{ fontFamily: "var(--ii-body-font)" }}>
        {invitation.sectionOrder.map((key) => (
          <Fragment key={key}>{sectionRenderers[key]}</Fragment>
        ))}
        <Closing copy={copy} />
      </div>
    </main>
  );
}
