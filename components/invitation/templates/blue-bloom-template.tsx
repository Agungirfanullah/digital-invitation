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
import { MemberParents } from "@/components/invitation/sections/member-parents";

/**
 * Blue Bloom — blue-and-white porcelain: the Hero is a decorated plate
 * (concentric rings and a band of petals around the names), portraits sit
 * in patterned porcelain rings, cards carry tile-corner motifs, and pale
 * tinted sections meet the white ones along a scalloped edge. Light and
 * airy throughout, drawn in thin lines of the theme's primary and accent
 * blues; no dark bands (Royal Gold, Art Deco and Garden Tropical use those).
 * Text/background contrast is verified in
 * `lib/invitations/templates/default-themes.test.ts`.
 */

/** A ring of petals around a circle, the plate's decorated rim. */
function PetalRing({ radius, count, size }: { radius: number; count: number; size: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i * 360) / count;
        return (
          <g key={i} transform={`rotate(${angle} 100 100)`}>
            <ellipse
              cx="100"
              cy={100 - radius}
              rx={size * 0.45}
              ry={size}
              fill="none"
              stroke="var(--ii-primary)"
              strokeWidth={0.9}
            />
            <circle cx="100" cy={100 - radius - size - 3} r="1.2" fill="var(--ii-accent)" />
          </g>
        );
      })}
    </g>
  );
}

/** The decorated plate behind the Hero heading. */
function Plate({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={`pointer-events-none ${className}`}>
      <circle cx="100" cy="100" r="97" fill="none" stroke="var(--ii-primary)" strokeWidth={1.25} />
      <circle cx="100" cy="100" r="92" fill="none" stroke="var(--ii-accent)" strokeWidth={0.6} />
      <PetalRing radius={80} count={24} size={7} />
      <circle
        cx="100"
        cy="100"
        r="66"
        fill="none"
        stroke="var(--ii-primary)"
        strokeWidth={0.6}
        strokeDasharray="2 3"
      />
      <circle cx="100" cy="100" r="62" fill="none" stroke="var(--ii-accent)" strokeWidth={0.6} />
    </svg>
  );
}

/** A small porcelain flower (petal outlines around a dot). */
function Blossom({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <ellipse
          key={angle}
          cx="20"
          cy="11"
          rx="4.5"
          ry="8"
          transform={`rotate(${angle} 20 20)`}
          fill="var(--ii-secondary)"
          stroke="var(--ii-primary)"
          strokeWidth={1}
        />
      ))}
      <circle cx="20" cy="20" r="3.5" fill="var(--ii-accent)" />
    </svg>
  );
}

/** A scalloped edge between a white section and a tinted one. */
function Scallop({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 10"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-3 w-full ${flip ? "rotate-180" : ""}`}
    >
      <path
        d="M0 10V5Q5 0 10 5T20 5T30 5T40 5T50 5T60 5T70 5T80 5T90 5T100 5T110 5T120 5V10Z"
        fill="color-mix(in oklab, var(--ii-secondary) 55%, var(--ii-background))"
      />
    </svg>
  );
}

const TINT = { background: "color-mix(in oklab, var(--ii-secondary) 55%, var(--ii-background))" };

/** A tinted section framed by scalloped edges. */
function Tinted({ children }: { children: ReactNode }) {
  return (
    <div>
      <Scallop />
      <div style={TINT}>{children}</div>
      <Scallop flip />
    </div>
  );
}

/** Tile-corner motif: a quarter-flower in each corner of a card. */
function TileCorners() {
  const corner = (className: string) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`absolute size-6 ${className}`}>
      <path
        d="M0 0h10a10 10 0 0 1-10 10Z"
        fill="var(--ii-accent)"
        fillOpacity={0.35}
        stroke="var(--ii-primary)"
        strokeWidth={0.8}
      />
      <circle cx="0" cy="0" r="4" fill="var(--ii-primary)" />
    </svg>
  );
  return (
    <>
      {corner("top-0 left-0")}
      {corner("top-0 right-0 -scale-x-100")}
      {corner("bottom-0 left-0 -scale-y-100")}
      {corner("right-0 bottom-0 -scale-100")}
    </>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Blossom className="size-7" />
      <p
        className="text-center text-2xl text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {children}
      </p>
      <span aria-hidden="true" className="flex items-center gap-1.5">
        <span className="h-px w-8 bg-[color:var(--ii-accent)]" />
        <span className="size-1 rounded-full bg-[color:var(--ii-primary)]" />
        <span className="size-1 rounded-full bg-[color:var(--ii-primary)]" />
        <span className="size-1 rounded-full bg-[color:var(--ii-primary)]" />
        <span className="h-px w-8 bg-[color:var(--ii-accent)]" />
      </span>
    </div>
  );
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;
  const heading = getHeroHeading(invitation);
  // The heading sits inside the plate's inner ring; long titles get smaller type to stay there.
  const headingSize = heading.length > 28 ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl";

  return (
    <section
      aria-label="Sampul undangan"
      className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      style={coverPhotoTextStyle(coverPhotoUrl)}
    >
      <CoverPhotoLayer imageUrl={coverPhotoUrl} />
      <div className="relative flex aspect-square w-full max-w-[22rem] flex-col items-center justify-center px-12">
        <Plate className="absolute inset-0 size-full" />
        <p className="relative text-[11px] tracking-[0.45em] text-[color:var(--ii-accent)] uppercase">
          {EVENT_TYPE_LABELS[invitation.type]}
        </p>
        <h1
          className={`relative mt-3 leading-tight text-balance break-words text-[color:var(--ii-primary)] ${headingSize}`}
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {heading}
        </h1>
        {heroDate && (
          <p className="relative mt-3 text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase">
            {formatIndonesianDate(heroDate)}
          </p>
        )}
      </div>
      <div className="relative mt-10">
        <p className="text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-75">
          Kepada Yth.
        </p>
        <p
          className="mt-1 text-2xl text-[color:var(--ii-primary)]"
          style={{ fontFamily: "var(--ii-script-font)" }}
        >
          {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
        </p>
      </div>
    </section>
  );
}

function Identity({ identity }: { identity: PublicIdentity }) {
  return (
    <section aria-labelledby="identity-heading">
      <Tinted>
        <div className="px-6 py-16 text-center">
          <h2 id="identity-heading" className="sr-only">
            {identity.heading}
          </h2>
          <SectionTitle>{identity.heading}</SectionTitle>
          {identity.members.length > 0 && (
            <div className="mx-auto mt-12 flex max-w-lg flex-col items-center gap-6">
              {identity.members.map((member, index) => (
                <Fragment key={`${index}-${member.name}`}>
                  {index > 0 && identity.pairMembers && (
                    <span
                      aria-hidden="true"
                      className="text-5xl text-[color:var(--ii-accent)]"
                      style={{ fontFamily: "var(--ii-script-font)" }}
                    >
                      &amp;
                    </span>
                  )}
                  <div className="flex flex-col items-center">
                    {member.photoUrl && (
                      <div className="relative size-48 rounded-full border border-[color:var(--ii-primary)] p-1.5">
                        <div className="size-full rounded-full border-2 border-dashed border-[color:var(--ii-accent)] p-1.5">
                          <div className="size-full overflow-hidden rounded-full bg-[color:var(--ii-secondary)]">
                            {/* eslint-disable-next-line @next/next/no-img-element -- our own uploaded storage object. */}
                            <img
                              src={member.photoUrl}
                              alt={`Foto ${member.name}`}
                              loading="lazy"
                              decoding="async"
                              className="size-full object-cover"
                            />
                          </div>
                        </div>
                        <Blossom className="absolute -right-1 bottom-2 size-10" />
                      </div>
                    )}
                    {member.role && (
                      <p className="mt-5 text-[11px] tracking-[0.35em] text-[color:var(--ii-accent)] uppercase">
                        {member.role}
                      </p>
                    )}
                    <p
                      className="mt-1 text-2xl text-[color:var(--ii-primary)]"
                      style={{ fontFamily: "var(--ii-heading-font)" }}
                    >
                      {member.name}
                    </p>
                    <MemberParents member={member} />
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
                </Fragment>
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
        </div>
      </Tinted>
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
      <SectionTitle>Rangkaian Acara</SectionTitle>
      <div className="mx-auto mt-12 flex max-w-md flex-col gap-8">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="relative overflow-hidden border border-[color:var(--ii-primary)] bg-[color:var(--ii-background)] p-1"
          >
            <div className="relative border border-[color:var(--ii-accent)] px-8 py-9 text-center">
              <TileCorners />
              <p
                className="text-xl text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {schedule.title}
              </p>
              <div className="mx-auto mt-5 flex w-fit items-stretch divide-x divide-[color:var(--ii-accent)] text-[color:var(--ii-text)]">
                <p className="px-4 text-sm tracking-wide">{formatIndonesianDate(schedule.date)}</p>
                <p className="px-4 text-sm tracking-wide">
                  {formatTimeRange(schedule.startTime, schedule.endTime)}
                </p>
              </div>
              {schedule.description && (
                <p className="mt-3 text-sm text-[color:var(--ii-text)] opacity-80">
                  {schedule.description}
                </p>
              )}
              {schedule.venue && (
                <div className="mt-5 space-y-1 text-sm">
                  <p className="font-medium text-[color:var(--ii-primary)]">
                    {schedule.venue.name}
                  </p>
                  <p className="text-[color:var(--ii-text)] opacity-80">{schedule.venue.address}</p>
                </div>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
                <a
                  href={buildGoogleCalendarUrl(schedule)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[color:var(--ii-primary)] px-5 py-2 text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90"
                >
                  Simpan Tanggal
                </a>
                {schedule.venue?.mapUrl && (
                  <a
                    href={schedule.venue.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[color:var(--ii-primary)] px-5 py-2 text-[color:var(--ii-primary)] transition-colors hover:bg-[color:var(--ii-secondary)]"
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
    <section aria-labelledby="love-story-heading">
      <Tinted>
        <div className="px-6 py-16">
          <h2 id="love-story-heading" className="sr-only">
            {loveStory.title ?? defaultTitle}
          </h2>
          <SectionTitle>{loveStory.title ?? defaultTitle}</SectionTitle>
          <ol className="mx-auto mt-12 grid max-w-md gap-4">
            {loveStory.items.map((item) => (
              <li
                key={item.id}
                className="rounded-[2.5rem] rounded-tl-md border border-[color:var(--ii-primary)]/30 bg-[color:var(--ii-background)] px-7 py-6 text-center"
              >
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="mx-auto mb-4 size-28 rounded-full border-2 border-[color:var(--ii-accent)] object-cover"
                  />
                )}
                {item.dateLabel && (
                  <p
                    className="text-xl text-[color:var(--ii-accent)]"
                    style={{ fontFamily: "var(--ii-script-font)" }}
                  >
                    {item.dateLabel}
                  </p>
                )}
                <p
                  className="text-lg text-[color:var(--ii-primary)]"
                  style={{ fontFamily: "var(--ii-heading-font)" }}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--ii-text)] opacity-80">
                    {item.description}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </Tinted>
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
      <SectionTitle>Galeri</SectionTitle>
      {nonEmpty.map((gallery, index) => (
        <div key={index} className="mx-auto mt-12 max-w-xl">
          {gallery.title && (
            <p className="mb-4 text-center text-sm tracking-wide text-[color:var(--ii-primary)]">
              {gallery.title}
            </p>
          )}
          <div className="border border-[color:var(--ii-primary)]/40 p-2">
            <GalleryGrid items={gallery.items} />
          </div>
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
    <section aria-labelledby="rsvp-heading">
      <Tinted>
        <div className="px-6 py-16">
          <h2 id="rsvp-heading" className="sr-only">
            RSVP
          </h2>
          <SectionTitle>Konfirmasi Kehadiran</SectionTitle>
          <div className="mx-auto mt-10 max-w-md">
            <RsvpSection eventId={eventId} rsvp={rsvp} embedded />
          </div>
        </div>
      </Tinted>
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
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-6 text-[color:var(--ii-text)]">
        {giftMethods.map((method) => (
          <div
            key={method.id}
            className="relative border border-[color:var(--ii-primary)]/50 bg-[color:var(--ii-background)] px-7 py-8 text-center text-sm"
          >
            <TileCorners />
            <p className="text-[11px] tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <p
              className="mt-1 text-xl text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
              {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            {method.accountName && (
              <p className="mt-2 opacity-80">Atas nama: {method.accountName}</p>
            )}
            {method.accountNumber && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="border-b border-dashed border-[color:var(--ii-accent)] pb-0.5 font-mono tracking-wider">
                  {method.accountNumber}
                </span>
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
    <section aria-labelledby="wishes-heading">
      <Tinted>
        <div className="px-6 py-16">
          <h2 id="wishes-heading" className="sr-only">
            Ucapan &amp; Doa
          </h2>
          <SectionTitle>Ucapan &amp; Doa</SectionTitle>
          <div className="mx-auto mt-10 max-w-md space-y-8 text-[color:var(--ii-text)]">
            {guest ? (
              <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
            ) : (
              <p className="border border-dashed border-[color:var(--ii-primary)]/50 bg-[color:var(--ii-background)] p-5 text-center text-sm opacity-80">
                Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
              </p>
            )}
            {wishes.length > 0 && (
              <ul className="space-y-3">
                {wishes.map((wish) => (
                  <li
                    key={wish.id}
                    className="bg-[color:var(--ii-background)] px-5 py-4 text-sm shadow-xs"
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{wish.message}</p>
                    <p className="mt-2 text-xs text-[color:var(--ii-primary)] opacity-80">
                      {wish.name} · {formatIndonesianDateTime(wish.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Tinted>
    </section>
  );
}

function Closing({ copy }: { copy: InvitationCopy }) {
  return (
    <section
      aria-label="Penutup"
      className="flex min-h-[60vh] flex-col items-center justify-center px-8 py-24 text-center"
    >
      <div className="relative mb-8 size-28">
        <Plate className="absolute inset-0 size-full" />
        <Blossom className="absolute inset-0 m-auto size-12" />
      </div>
      <p
        className="mx-auto max-w-md text-xl leading-relaxed text-balance text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {copy.closingMessage}
      </p>
      <p
        className="mt-6 text-2xl text-[color:var(--ii-accent)]"
        style={{ fontFamily: "var(--ii-script-font)" }}
      >
        {copy.closingThanks}
      </p>
    </section>
  );
}

export function BlueBloomTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
