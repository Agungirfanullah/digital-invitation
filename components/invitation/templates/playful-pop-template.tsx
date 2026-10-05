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
 * Bright/playful composition — not wedding-specific like every other
 * template here. Big bold rounded headings, a confetti-dot motif, and a
 * bordered pill badge (never a solid-fill badge, since this product has
 * no guaranteed readable-on-primary color — see `theme-vars.ts`). Built
 * for the non-wedding event types CLAUDE.md requires this engine to
 * genuinely support (birthday, gathering, anniversary), not reskinned
 * from a romantic template. Text/background contrast is verified in
 * `lib/invitations/templates/default-themes.test.ts`.
 */

/** A scattered mix of star/circle/ribbon shapes — richer than a tidy row of uniform dots, leaning further into "confetti" rather than away from it. */
function ConfettiBurst({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 160 32" className={className} fill="none">
      <path
        d="M18 4l2.2 5.6L26 12l-5.8 2.4L18 20l-2.2-5.6L10 12l5.8-2.4L18 4Z"
        fill="var(--ii-primary)"
      />
      <circle cx="46" cy="18" r="3.5" fill="var(--ii-accent)" />
      <rect
        x="62"
        y="8"
        width="9"
        height="3.5"
        rx="1"
        fill="var(--ii-secondary)"
        transform="rotate(20 66.5 9.75)"
      />
      <circle cx="88" cy="10" r="2.8" fill="var(--ii-primary)" />
      <path d="M110 10l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6 1.6-4Z" fill="var(--ii-accent)" />
      <rect
        x="128"
        y="18"
        width="9"
        height="3.5"
        rx="1"
        fill="var(--ii-primary)"
        transform="rotate(-18 132.5 19.75)"
      />
      <circle cx="148" cy="7" r="3" fill="var(--ii-secondary)" />
    </svg>
  );
}

function PillLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block rounded-full border-2 px-5 py-1.5 text-xs font-bold tracking-wide uppercase"
      style={{ borderColor: "var(--ii-primary)", color: "var(--ii-primary)" }}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-sm font-bold tracking-wide text-[color:var(--ii-primary)] uppercase">
      {children}
    </p>
  );
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;

  return (
    <section
      aria-label="Sampul undangan"
      className="relative flex min-h-[85vh] flex-col items-center justify-center gap-5 px-6 py-16 text-center"
      style={coverPhotoTextStyle(coverPhotoUrl)}
    >
      <CoverPhotoLayer imageUrl={coverPhotoUrl} />
      <div className="relative">
        <PillLabel>{EVENT_TYPE_LABELS[invitation.type]}</PillLabel>
      </div>
      <h1
        className="relative max-w-md text-5xl font-bold text-balance text-[color:var(--ii-primary)] sm:text-6xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {getHeroHeading(invitation)}
      </h1>
      <ConfettiBurst className="relative h-6 w-40" />
      {heroDate && (
        <p className="relative text-sm font-medium text-[color:var(--ii-text)]">
          {formatIndonesianDate(heroDate)}
        </p>
      )}
      <div className="relative mt-4 space-y-1">
        <p className="text-xs font-bold tracking-wide text-[color:var(--ii-text)] uppercase opacity-70">
          Kepada
        </p>
        <p className="text-lg font-bold text-[color:var(--ii-primary)]">
          {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
        </p>
      </div>
    </section>
  );
}

function Identity({ identity }: { identity: PublicIdentity }) {
  return (
    <section aria-labelledby="identity-heading" className="px-6 py-16 text-center">
      <h2 id="identity-heading" className="sr-only">
        {identity.heading}
      </h2>
      <SectionLabel>{identity.heading}</SectionLabel>
      {identity.members.length > 0 && (
        <div className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-4">
          {identity.members.map((member, index) => (
            <div
              key={`${index}-${member.name}`}
              className="rounded-3xl border-4 border-[color:var(--ii-secondary)] px-6 py-5"
            >
              <p
                className="text-2xl font-bold text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {member.name}
              </p>
              {member.instagram && (
                <a
                  href={toInstagramProfileUrl(member.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm text-[color:var(--ii-text)] underline-offset-2 opacity-70 hover:underline"
                >
                  @{member.instagram}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {identity.details.length > 0 && (
        <ul className="mx-auto mt-8 max-w-sm space-y-1 text-sm text-[color:var(--ii-text)] opacity-80">
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
    <section aria-labelledby="schedule-heading" className="px-6 py-16">
      <h2 id="schedule-heading" className="sr-only">
        Rangkaian Acara
      </h2>
      <SectionLabel>Rangkaian Acara</SectionLabel>
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-5">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="rounded-3xl border-4 border-[color:var(--ii-secondary)] p-6 text-center"
          >
            <p
              className="text-xl font-bold text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
              {schedule.title}
            </p>
            <p className="mt-2 text-sm font-medium text-[color:var(--ii-text)]">
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
                <p className="font-bold text-[color:var(--ii-primary)]">{schedule.venue.name}</p>
                <p className="text-[color:var(--ii-text)] opacity-80">{schedule.venue.address}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
              <a
                href={buildGoogleCalendarUrl(schedule)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-medium text-[color:var(--ii-accent)] underline underline-offset-4"
              >
                Simpan Tanggal
              </a>
              {schedule.venue?.mapUrl && (
                <a
                  href={schedule.venue.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-medium text-[color:var(--ii-accent)] underline underline-offset-4"
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
    <section aria-labelledby="love-story-heading" className="px-6 py-16">
      <h2 id="love-story-heading" className="sr-only">
        {loveStory.title ?? defaultTitle}
      </h2>
      <SectionLabel>{loveStory.title ?? defaultTitle}</SectionLabel>
      <ol className="mx-auto mt-10 flex max-w-md flex-col gap-8">
        {loveStory.items.map((item) => (
          <li key={item.id} className="text-center">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="mx-auto mb-3 h-44 w-44 rounded-3xl border-4 border-[color:var(--ii-secondary)] object-cover"
              />
            )}
            {item.dateLabel && (
              <p className="text-xs font-bold tracking-wide text-[color:var(--ii-accent)] uppercase">
                {item.dateLabel}
              </p>
            )}
            <p
              className="mt-1 text-xl font-bold text-[color:var(--ii-primary)]"
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
    <section aria-labelledby="gallery-heading" className="px-6 py-16">
      <h2 id="gallery-heading" className="sr-only">
        Galeri
      </h2>
      <SectionLabel>Galeri</SectionLabel>
      {nonEmpty.map((gallery, index) => (
        <div key={index} className="mx-auto mt-10 max-w-xl">
          {gallery.title && (
            <p className="mb-3 text-center text-sm font-medium text-[color:var(--ii-primary)]">
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
            className="rounded-3xl border-4 border-[color:var(--ii-secondary)] p-6 text-center text-sm"
          >
            <p className="text-xs font-bold tracking-wide text-[color:var(--ii-accent)] uppercase">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <p
              className="mt-2 text-lg font-bold text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
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
                className="mx-auto mt-3 h-40 w-40 rounded-2xl object-contain"
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
      <div className="mx-auto mt-8 max-w-md space-y-6 text-[color:var(--ii-text)]">
        {guest ? (
          <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
        ) : (
          <p className="rounded-3xl border-4 border-[color:var(--ii-secondary)] p-5 text-center text-sm opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
        {wishes.length > 0 && (
          <ul className="space-y-3">
            {wishes.map((wish) => (
              <li
                key={wish.id}
                className="rounded-3xl border-4 border-[color:var(--ii-secondary)] p-4 text-center text-sm"
              >
                <p className="whitespace-pre-wrap">{wish.message}</p>
                <p className="mt-2 text-xs font-medium opacity-70">
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
      className="flex min-h-[55vh] flex-col items-center justify-center px-6 py-20 text-center"
    >
      <p
        className="mx-auto max-w-md text-2xl leading-relaxed font-bold text-balance text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {copy.closingMessage}
      </p>
      <ConfettiBurst className="my-6 h-6 w-40" />
      <p className="text-xs font-bold tracking-wide text-[color:var(--ii-text)] uppercase opacity-70">
        {copy.closingThanks}
      </p>
    </section>
  );
}

export function PlayfulPopTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
