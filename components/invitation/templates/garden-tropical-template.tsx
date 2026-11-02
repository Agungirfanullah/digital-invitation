import { Fragment, type CSSProperties, type ReactNode } from "react";
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
import { MemberParents } from "@/components/invitation/sections/member-parents";

/**
 * Garden Tropical — a lush garden party: palm fronds reaching in from the
 * page edges, deep bands in the theme's primary color (forest green by
 * default) alternating with pale sage, tall arched portraits with a frond
 * laid over one corner, and names in the script font. Floral Romance is
 * blossoms on blush; Blue Bloom is porcelain patterns; this one is foliage
 * on green. Text/background contrast is verified in
 * `lib/invitations/templates/default-themes.test.ts`; text on the green
 * bands uses the theme's computed readable foreground.
 */

const BAND_STYLE = {
  background: "var(--ii-primary)",
  "--ii-band": "var(--ii-primary)",
} as CSSProperties;
const ON_BAND_VARS = {
  "--ii-text": "var(--primary-foreground)",
  "--ii-primary": "var(--primary-foreground)",
} as CSSProperties;

function Band({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div style={BAND_STYLE} className="relative isolate overflow-hidden">
      <div style={ON_BAND_VARS} className={className}>
        {children}
      </div>
    </div>
  );
}

/** A palm frond: a curved rib with leaflets on both sides. */
function Frond({
  className = "",
  tone = "accent",
}: {
  className?: string;
  tone?: "accent" | "text";
}) {
  const color = tone === "accent" ? "var(--ii-accent)" : "var(--ii-text)";
  const leaflets = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg viewBox="0 0 120 200" aria-hidden="true" className={`pointer-events-none ${className}`}>
      <path
        d="M60 196C58 140 52 80 30 8"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.7}
      />
      {leaflets.map((i) => {
        const t = i / 8;
        const x = 60 - 30 * t * t;
        const y = 190 - 175 * t;
        const length = 46 - i * 3.2;
        return (
          <g key={i} fill={color} fillOpacity={0.45 + t * 0.2}>
            <path
              transform={`translate(${x} ${y}) rotate(${-150 + i * 4})`}
              d={`M0 0C${length * 0.35} -6 ${length * 0.75} -5 ${length} 0C${length * 0.75} 4 ${length * 0.35} 5 0 0Z`}
            />
            <path
              transform={`translate(${x} ${y}) rotate(${-30 - i * 6})`}
              d={`M0 0C${length * 0.35} -6 ${length * 0.75} -5 ${length} 0C${length * 0.75} 4 ${length * 0.35} 5 0 0Z`}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** A single leaf, used as a bullet and divider. */
function LeafMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`size-5 text-[color:var(--ii-accent)] ${className}`}
    >
      <path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16Z" fill="currentColor" fillOpacity={0.5} />
      <path d="M4 20 15 9" fill="none" stroke="currentColor" strokeWidth={1.25} />
    </svg>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span aria-hidden="true" className="flex items-center gap-1">
        <LeafMark className="size-4 -scale-x-100" />
        <LeafMark className="size-4" />
      </span>
      <p
        className="text-center text-4xl text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-script-font)" }}
      >
        {children}
      </p>
    </div>
  );
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;

  const content = (
    <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-4 text-center">
      <p className="text-xs tracking-[0.45em] text-[color:var(--ii-accent)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>
      <h1
        className="text-6xl leading-tight text-balance text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-script-font)" }}
      >
        {getHeroHeading(invitation)}
      </h1>
      {heroDate && (
        <p className="flex items-center gap-3 text-sm tracking-[0.3em] text-[color:var(--ii-text)] uppercase">
          <LeafMark className="size-4 -scale-x-100" />
          {formatIndonesianDate(heroDate)}
          <LeafMark className="size-4" />
        </p>
      )}
      <div className="mt-8">
        <p className="text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-75">
          Kepada Yth.
        </p>
        <p className="mt-1 text-lg font-medium text-[color:var(--ii-primary)]">
          {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
        </p>
      </div>
    </div>
  );

  const fronds = (
    <>
      <Frond className="absolute -top-6 -left-10 w-36 rotate-[200deg]" />
      <Frond className="absolute -top-10 -right-8 w-32 rotate-[150deg] opacity-80" />
      <Frond className="absolute -bottom-8 -left-6 w-32 rotate-[20deg] opacity-80" />
      <Frond className="absolute -right-10 -bottom-6 w-40 -rotate-[25deg]" />
    </>
  );

  if (coverPhotoUrl) {
    return (
      <section
        aria-label="Sampul undangan"
        className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-8 py-24"
        style={coverPhotoTextStyle(coverPhotoUrl)}
      >
        <CoverPhotoLayer imageUrl={coverPhotoUrl} />
        {fronds}
        {content}
      </section>
    );
  }

  return (
    <section aria-label="Sampul undangan">
      <Band className="relative flex min-h-screen flex-col items-center justify-center px-8 py-24">
        {fronds}
        {content}
      </Band>
    </section>
  );
}

function Identity({ identity }: { identity: PublicIdentity }) {
  return (
    <section aria-labelledby="identity-heading" className="px-6 py-20 text-center">
      <h2 id="identity-heading" className="sr-only">
        {identity.heading}
      </h2>
      <SectionTitle>{identity.heading}</SectionTitle>
      {identity.members.length > 0 && (
        <div className="mx-auto mt-12 grid max-w-lg gap-12">
          {identity.members.map((member, index) => (
            <div key={`${index}-${member.name}`} className="flex flex-col items-center">
              {member.photoUrl && (
                <div className="relative">
                  <div className="h-60 w-44 overflow-hidden rounded-t-full border-[6px] border-[color:var(--ii-secondary)] bg-[color:var(--ii-secondary)] shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element -- our own uploaded storage object. */}
                    <img
                      src={member.photoUrl}
                      alt={`Foto ${member.name}`}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                    />
                  </div>
                  <Frond
                    className={`absolute -bottom-6 w-20 ${
                      index % 2 === 0 ? "-left-10 rotate-[35deg]" : "-right-10 -rotate-[35deg]"
                    }`}
                  />
                </div>
              )}
              {member.role && (
                <p className="mt-7 text-[11px] tracking-[0.35em] text-[color:var(--ii-accent)] uppercase">
                  {member.role}
                </p>
              )}
              <p
                className="mt-1 text-4xl text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-script-font)" }}
              >
                {member.name}
              </p>
              <MemberParents member={member} />
              {member.instagram && (
                <a
                  href={toInstagramProfileUrl(member.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ii-secondary)]/70 px-3 py-1 text-xs text-[color:var(--ii-text)] hover:underline"
                >
                  @{member.instagram}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {identity.details.length > 0 && (
        <ul className="mx-auto mt-10 max-w-md space-y-2 text-sm text-[color:var(--ii-text)] opacity-80">
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
    <section aria-labelledby="schedule-heading">
      <Band className="relative px-8 py-20 text-center">
        <Frond className="absolute -top-10 -left-12 w-32 rotate-[210deg] opacity-60" />
        <Frond className="absolute -right-12 -bottom-10 w-32 -rotate-[20deg] opacity-60" />
        <h2 id="schedule-heading" className="sr-only">
          Rangkaian Acara
        </h2>
        <SectionTitle>Rangkaian Acara</SectionTitle>
        <div className="relative mx-auto mt-10 flex max-w-md flex-col">
          {schedules.map((schedule, index) => (
            <Fragment key={schedule.id}>
              {index > 0 && (
                <span aria-hidden="true" className="my-8 flex items-center justify-center gap-3">
                  <span className="h-px w-16 bg-[color:var(--ii-accent)]/60" />
                  <LeafMark className="size-4" />
                  <span className="h-px w-16 bg-[color:var(--ii-accent)]/60" />
                </span>
              )}
              <div>
                <p
                  className="text-4xl text-[color:var(--ii-primary)]"
                  style={{ fontFamily: "var(--ii-script-font)" }}
                >
                  {schedule.title}
                </p>
                <p className="mt-3 text-sm tracking-[0.25em] text-[color:var(--ii-text)] uppercase">
                  {formatIndonesianDate(schedule.date)}
                </p>
                <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-85">
                  {formatTimeRange(schedule.startTime, schedule.endTime)}
                </p>
                {schedule.description && (
                  <p className="mt-3 text-sm text-[color:var(--ii-text)] opacity-85">
                    {schedule.description}
                  </p>
                )}
                {schedule.venue && (
                  <div className="mt-4 space-y-1 text-sm">
                    <p className="font-medium text-[color:var(--ii-primary)]">
                      {schedule.venue.name}
                    </p>
                    <p className="text-[color:var(--ii-text)] opacity-85">
                      {schedule.venue.address}
                    </p>
                  </div>
                )}
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
                  <a
                    href={buildGoogleCalendarUrl(schedule)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[color:var(--ii-text)] px-5 py-2 font-medium text-[color:var(--ii-band)] transition-opacity hover:opacity-90"
                  >
                    Simpan Tanggal
                  </a>
                  {schedule.venue?.mapUrl && (
                    <a
                      href={schedule.venue.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-[color:var(--ii-text)]/50 px-5 py-2 text-[color:var(--ii-text)] transition-colors hover:bg-[color:var(--ii-text)]/10"
                    >
                      Buka Peta
                    </a>
                  )}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </Band>
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
      <SectionTitle>{loveStory.title ?? defaultTitle}</SectionTitle>
      <ol className="mx-auto mt-12 flex max-w-md flex-col gap-5">
        {loveStory.items.map((item, index) => (
          <li
            key={item.id}
            className={`relative overflow-hidden rounded-3xl bg-[color:var(--ii-secondary)]/50 p-6 ${
              index % 2 === 1 ? "ml-6" : "mr-6"
            }`}
          >
            <LeafMark
              className={`absolute top-4 size-10 opacity-40 ${index % 2 === 1 ? "left-4 -scale-x-100" : "right-4"}`}
            />
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="mb-4 aspect-[4/3] w-full rounded-2xl object-cover"
              />
            )}
            {item.dateLabel && (
              <p className="text-xs font-medium tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
                {item.dateLabel}
              </p>
            )}
            <p
              className="mt-1 text-xl font-semibold text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
              {item.title}
            </p>
            {item.description && (
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--ii-text)] opacity-85">
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
    <section
      aria-labelledby="gallery-heading"
      className="relative isolate overflow-hidden px-6 py-20"
    >
      <Frond className="absolute top-6 -right-14 -z-10 w-32 -rotate-[30deg] opacity-30" />
      <h2 id="gallery-heading" className="sr-only">
        Galeri
      </h2>
      <SectionTitle>Galeri</SectionTitle>
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
    <section aria-labelledby="rsvp-heading" className="px-6 py-20">
      <h2 id="rsvp-heading" className="sr-only">
        RSVP
      </h2>
      <SectionTitle>Konfirmasi Kehadiran</SectionTitle>
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
      <SectionTitle>Kirim Hadiah</SectionTitle>
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-5 text-[color:var(--ii-text)]">
        {giftMethods.map((method) => (
          <div
            key={method.id}
            className="relative overflow-hidden rounded-3xl border border-[color:var(--ii-accent)]/30 bg-[color:var(--ii-background)] p-6 text-sm shadow-sm"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1.5 bg-[color:var(--ii-accent)]"
            />
            <p className="text-xs tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <p
              className="mt-1 text-xl font-semibold text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
              {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            {method.accountName && (
              <p className="mt-1 opacity-80">Atas nama: {method.accountName}</p>
            )}
            {method.accountNumber && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-base tracking-wider">{method.accountNumber}</span>
                <CopyValueButton value={method.accountNumber} label="Salin Nomor" />
              </div>
            )}
            {method.qrImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
              <img
                src={method.qrImageUrl}
                alt={`Kode QR ${method.providerName ?? "hadiah"}`}
                loading="lazy"
                className="mt-4 h-40 w-40 rounded-2xl object-contain"
              />
            )}
            {method.instructions && (
              <div className="mt-3 flex flex-col items-start gap-2">
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
      <SectionTitle>Ucapan &amp; Doa</SectionTitle>
      <div className="mx-auto mt-10 max-w-md space-y-8 text-[color:var(--ii-text)]">
        {guest ? (
          <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
        ) : (
          <p className="rounded-3xl border border-dashed border-[color:var(--ii-accent)]/50 p-6 text-center text-sm opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
        {wishes.length > 0 && (
          <ul className="space-y-3">
            {wishes.map((wish) => (
              <li key={wish.id} className="flex gap-3 text-sm">
                <LeafMark className="mt-1 size-4 shrink-0" />
                <div className="min-w-0 flex-1 rounded-2xl bg-[color:var(--ii-secondary)]/50 px-5 py-4">
                  <p className="leading-relaxed whitespace-pre-wrap">{wish.message}</p>
                  <p className="mt-2 text-xs opacity-70">
                    {wish.name} · {formatIndonesianDateTime(wish.createdAt)}
                  </p>
                </div>
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
    <section aria-label="Penutup">
      <Band className="relative flex min-h-[60vh] flex-col items-center justify-center px-8 py-24 text-center">
        <Frond className="absolute -bottom-10 -left-10 w-40 rotate-[25deg] opacity-70" />
        <Frond className="absolute -right-10 -bottom-10 w-40 -rotate-[25deg] opacity-70" />
        <p
          className="relative mx-auto max-w-lg text-xl leading-relaxed text-balance text-[color:var(--ii-primary)] sm:text-2xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {copy.closingMessage}
        </p>
        <p
          className="relative mt-8 text-4xl text-[color:var(--ii-text)] opacity-90"
          style={{ fontFamily: "var(--ii-script-font)" }}
        >
          {copy.closingThanks}
        </p>
      </Band>
    </section>
  );
}

export function GardenTropicalTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
