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
 * Stark black-on-white "exhibition print" composition — pure monochrome
 * (no hue at all, unlike every other template here), viewfinder-style
 * crop-mark corners framing the Hero, thick sharp-cornered (never
 * rounded) borders on every card/photo, and tall condensed uppercase
 * display type. Deliberately not Modern Editorial (which keeps a serif
 * display face and a red accent) or Dark Luxury (dark background) — this
 * one stays white-ground, black-ink, zero rounded corners anywhere.
 * Text/background contrast is verified in
 * `lib/invitations/templates/default-themes.test.ts`.
 */

function FrameCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={`text-[color:var(--ii-primary)] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M2 14V2h12" />
    </svg>
  );
}

/** A tiny crop-mark tick flanking section labels — the same sharp-cornered register-mark idiom as FrameCorner, never a curve. */
function CropTick({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 10 10"
      className={`inline-block h-2.5 w-2.5 shrink-0 text-[color:var(--ii-primary)] ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path d="M1 1h4M1 1v4" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-center justify-center gap-3 text-center text-sm font-medium tracking-[0.3em] text-[color:var(--ii-primary)] uppercase"
      style={{ fontFamily: "var(--ii-heading-font)" }}
    >
      <CropTick />
      {children}
      <CropTick flip />
    </p>
  );
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;

  return (
    <section
      aria-label="Sampul undangan"
      className="relative flex min-h-screen flex-col items-center justify-center gap-5 px-6 py-16 text-center"
      style={coverPhotoTextStyle(coverPhotoUrl)}
    >
      <CoverPhotoLayer imageUrl={coverPhotoUrl} />
      <FrameCorner className="absolute top-6 left-6 size-8" />
      <FrameCorner className="absolute top-6 right-6 size-8 -scale-x-100" />
      <FrameCorner className="absolute bottom-6 left-6 size-8 -scale-y-100" />
      <FrameCorner className="absolute right-6 bottom-6 size-8 -scale-x-100 -scale-y-100" />

      <p className="relative text-xs font-medium tracking-[0.5em] text-[color:var(--ii-text)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>
      <h1
        className="relative max-w-2xl text-6xl leading-[0.95] text-balance text-[color:var(--ii-primary)] uppercase sm:text-8xl"
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
        <p className="text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-70">
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
    <section aria-labelledby="identity-heading" className="px-6 py-20 text-center">
      <h2 id="identity-heading" className="sr-only">
        {identity.heading}
      </h2>
      <SectionLabel>{identity.heading}</SectionLabel>
      {identity.members.length > 0 && (
        <div className="mx-auto mt-10 flex max-w-lg flex-col items-center divide-y-2 divide-[color:var(--ii-primary)] sm:flex-row sm:divide-x-2 sm:divide-y-0">
          {identity.members.map((member, index) => (
            <div key={`${index}-${member.name}`} className="px-10 py-6">
              <p
                className="text-3xl text-[color:var(--ii-primary)] uppercase"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {member.name}
              </p>
              {member.instagram && (
                <a
                  href={toInstagramProfileUrl(member.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-[color:var(--ii-text)] underline-offset-2 opacity-70 hover:underline"
                >
                  @{member.instagram}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {identity.details.length > 0 && (
        <ul className="mx-auto mt-8 max-w-md space-y-2 text-sm tracking-wide text-[color:var(--ii-text)] opacity-80">
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
    <section aria-labelledby="schedule-heading" className="px-6 py-20">
      <h2 id="schedule-heading" className="sr-only">
        Rangkaian Acara
      </h2>
      <SectionLabel>Rangkaian Acara</SectionLabel>
      <div className="mx-auto mt-12 flex max-w-md flex-col gap-6">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="border-2 border-[color:var(--ii-primary)] p-7 text-center"
          >
            <p
              className="text-2xl text-[color:var(--ii-primary)] uppercase"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
              {schedule.title}
            </p>
            <p className="mt-2 text-sm tracking-wide text-[color:var(--ii-text)]">
              {formatIndonesianDate(schedule.date)}
            </p>
            <p className="text-sm text-[color:var(--ii-text)] opacity-80">
              {formatTimeRange(schedule.startTime, schedule.endTime)}
            </p>
            {schedule.description && (
              <p className="mt-3 text-sm text-[color:var(--ii-text)] opacity-80">
                {schedule.description}
              </p>
            )}
            {schedule.venue && (
              <div className="mt-4 space-y-1 text-sm">
                <p className="font-medium text-[color:var(--ii-primary)]">{schedule.venue.name}</p>
                <p className="text-[color:var(--ii-text)] opacity-80">{schedule.venue.address}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
              <a
                href={buildGoogleCalendarUrl(schedule)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[color:var(--ii-primary)] underline underline-offset-4"
              >
                Simpan Tanggal
              </a>
              {schedule.venue?.mapUrl && (
                <a
                  href={schedule.venue.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[color:var(--ii-primary)] underline underline-offset-4"
                >
                  Buka Peta
                </a>
              )}
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
    <section aria-labelledby="love-story-heading" className="px-6 py-20">
      <h2 id="love-story-heading" className="sr-only">
        {loveStory.title ?? defaultTitle}
      </h2>
      <SectionLabel>{loveStory.title ?? defaultTitle}</SectionLabel>
      <ol className="mx-auto mt-12 flex max-w-md flex-col gap-10">
        {loveStory.items.map((item) => (
          <li key={item.id} className="text-center">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="mx-auto mb-4 aspect-[4/5] w-48 border-2 border-[color:var(--ii-primary)] object-cover grayscale"
              />
            )}
            {item.dateLabel && (
              <p className="text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-70">
                {item.dateLabel}
              </p>
            )}
            <p
              className="mt-2 text-xl text-[color:var(--ii-primary)] uppercase"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
              {item.title}
            </p>
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
    <section aria-labelledby="gallery-heading" className="px-6 py-20">
      <h2 id="gallery-heading" className="sr-only">
        Galeri
      </h2>
      <SectionLabel>Galeri</SectionLabel>
      {nonEmpty.map((gallery, index) => (
        <div
          key={index}
          className="mx-auto mt-12 max-w-xl border-2 border-[color:var(--ii-primary)] p-3"
        >
          {gallery.title && (
            <p className="mb-4 text-center text-sm tracking-wide text-[color:var(--ii-primary)] uppercase">
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
    <section aria-labelledby="rsvp-heading" className="px-6 py-20">
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
    <section aria-labelledby="gift-heading" className="px-6 py-20">
      <h2 id="gift-heading" className="sr-only">
        Kirim Hadiah
      </h2>
      <SectionLabel>Kirim Hadiah</SectionLabel>
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-6 text-[color:var(--ii-text)]">
        {giftMethods.map((method) => (
          <div
            key={method.id}
            className="border-2 border-[color:var(--ii-primary)] p-6 text-center text-sm"
          >
            <p className="text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-70">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <p
              className="mt-2 text-xl text-[color:var(--ii-primary)] uppercase"
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
    <section aria-labelledby="wishes-heading" className="px-6 py-20">
      <h2 id="wishes-heading" className="sr-only">
        Ucapan &amp; Doa
      </h2>
      <SectionLabel>Ucapan &amp; Doa</SectionLabel>
      <div className="mx-auto mt-10 max-w-md space-y-8 text-[color:var(--ii-text)]">
        {guest ? (
          <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
        ) : (
          <p className="border-2 border-dashed border-[color:var(--ii-primary)] p-5 text-center text-sm opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
        {wishes.length > 0 && (
          <ul className="space-y-4">
            {wishes.map((wish) => (
              <li
                key={wish.id}
                className="border-2 border-[color:var(--ii-primary)] p-5 text-center text-sm"
              >
                <p className="whitespace-pre-wrap">{wish.message}</p>
                <p className="mt-3 text-xs tracking-[0.2em] opacity-70">
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
      className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center"
    >
      <p
        className="mx-auto max-w-lg text-3xl leading-relaxed text-balance text-[color:var(--ii-primary)] uppercase sm:text-4xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {copy.closingMessage}
      </p>
      <div className="my-8 h-0.5 w-16 bg-[color:var(--ii-primary)]" aria-hidden />
      <p className="text-xs tracking-[0.4em] text-[color:var(--ii-text)] uppercase opacity-70">
        {copy.closingThanks}
      </p>
    </section>
  );
}

export function MonoFrameTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
