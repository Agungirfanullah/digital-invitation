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
import { MemberPhoto } from "@/components/invitation/sections/member-photo";
import { MemberParents } from "@/components/invitation/sections/member-parents";

/**
 * Royal Gold — a regal, ceremonial composition: a crest monogram inside a
 * laurel wreath, double gold frames with curled corners, and deep bands in
 * the theme's primary color (navy by default) alternating with ivory.
 * Everything is centered and symmetrical. Art Deco, its nearest neighbor,
 * is the opposite: straight geometry, no curls, black bands with vertical
 * rules. Text/background contrast is verified in
 * `lib/invitations/templates/default-themes.test.ts`; text on the primary
 * bands uses the theme's computed readable foreground, so an owner's own
 * colors stay legible.
 */

/** Wrapper for a band in the primary color. Text vars are rescoped on the inner element. */
const BAND_STYLE: CSSProperties = { background: "var(--ii-primary)" };
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

/** "Ayu & Budi" -> "A&B", "Citra" -> "C". */
function monogramOf(heading: string): string {
  return heading
    .split("&")
    .map((part) => part.trim()[0] ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("&")
    .toUpperCase();
}

/** A crest: the initials inside a laurel wreath, crowned by a small fleuron. */
function Crest({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <div aria-hidden="true" className={`relative mx-auto size-32 ${className}`}>
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 size-full text-[color:var(--ii-accent)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
      >
        <circle cx="60" cy="62" r="40" strokeWidth={0.75} opacity={0.6} />
        <circle cx="60" cy="62" r="36" strokeWidth={1.25} />
        {/* Laurel: two arcs of leaves meeting at the bottom. */}
        {Array.from({ length: 7 }, (_, i) => {
          const angle = 200 - i * 22;
          const rad = (angle * Math.PI) / 180;
          const x = 60 + 48 * Math.cos(rad);
          const y = 62 - 48 * Math.sin(rad);
          return (
            <g key={i}>
              <ellipse
                cx={x}
                cy={y}
                rx="6"
                ry="2.4"
                transform={`rotate(${-angle + 90} ${x} ${y})`}
                fill="currentColor"
                fillOpacity={0.35}
              />
              <ellipse
                cx={120 - x}
                cy={y}
                rx="6"
                ry="2.4"
                transform={`rotate(${angle - 90} ${120 - x} ${y})`}
                fill="currentColor"
                fillOpacity={0.35}
              />
            </g>
          );
        })}
        <path d="M52 14c3-4 5-6 8-10 3 4 5 6 8 10M56 18h8" strokeWidth={1.25} />
        <circle cx="60" cy="4" r="1.6" fill="currentColor" stroke="none" />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center pt-2 text-3xl tracking-wide text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {initials}
      </span>
    </div>
  );
}

/** A swag: a scrolled rule with a fleuron at its center. */
function Swag({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 24"
      aria-hidden="true"
      className={`mx-auto h-6 w-48 text-[color:var(--ii-accent)] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
    >
      <path d="M4 12h62M134 12h62" />
      <path d="M66 12c8 0 10-8 18-8 6 0 8 4 8 8M134 12c-8 0-10-8-18-8-6 0-8 4-8 8" />
      <path d="M92 12c0 5 3 8 8 8s8-3 8-8" />
      <path d="M100 4l3 4-3 4-3-4z" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="196" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A double-line corner bracket with a curled terminal. */
function CornerFlourish({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      aria-hidden="true"
      className={`text-[color:var(--ii-accent)] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path d="M3 3v18c0 9 7 16 16 16h18" strokeWidth={1.25} />
      <path d="M9 3v12c0 7.5 5.5 13 13 13h12" strokeWidth={0.75} opacity={0.7} />
      <path d="M3 3c4 0 6 2 6 6M37 37c0-4 2-6 6-6" strokeWidth={0.75} />
      <circle cx="3" cy="3" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Full class names so Tailwind can see them.
const CORNER_POSITIONS = {
  near: ["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "right-2 bottom-2"],
  far: ["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "right-4 bottom-4"],
} as const;
const CORNER_FLIPS = ["", "-scale-x-100", "-scale-y-100", "-scale-100"] as const;

function Corners({ size = "size-10", inset = "near" }: { size?: string; inset?: "near" | "far" }) {
  return (
    <>
      {CORNER_POSITIONS[inset].map((position, index) => (
        <CornerFlourish
          key={position}
          className={`absolute ${position} ${size} ${CORNER_FLIPS[index]}`}
        />
      ))}
    </>
  );
}

/** Section title: the visible label between two short gold rules, over a fleuron. */
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5 text-[color:var(--ii-accent)]"
        fill="currentColor"
      >
        <path d="M12 2c1.5 3 4 4.5 7 5-3 .5-5.5 2-7 5-1.5-3-4-4.5-7-5 3-.5 5.5-2 7-5Z" />
        <circle cx="12" cy="18" r="2" />
      </svg>
      <p
        className="text-center text-sm tracking-[0.3em] text-[color:var(--ii-primary)] uppercase"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {children}
      </p>
      <Swag className="w-32" />
    </div>
  );
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;
  const heading = getHeroHeading(invitation);

  const content = (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center gap-5 text-center">
      <Crest initials={monogramOf(heading)} />
      <p className="text-xs font-medium tracking-[0.5em] text-[color:var(--ii-accent)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>
      <h1
        className="max-w-xs text-4xl leading-tight text-balance text-[color:var(--ii-primary)] sm:text-5xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {heading}
      </h1>
      <Swag />
      {heroDate && (
        <p className="text-sm tracking-[0.3em] text-[color:var(--ii-text)] uppercase">
          {formatIndonesianDate(heroDate)}
        </p>
      )}
      <div className="relative mt-4 w-full max-w-xs border border-[color:var(--ii-accent)]/60 px-6 py-4">
        <span className="absolute -top-px left-1/2 h-px w-10 -translate-x-1/2 bg-[color:var(--ii-accent)]" />
        <p className="text-[11px] tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-75">
          Kepada Yth.
        </p>
        <p className="mt-1 text-lg font-medium text-[color:var(--ii-primary)]">
          {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
        </p>
      </div>
    </div>
  );

  // With a cover photo the hero sits on it; without one it is a primary band.
  if (coverPhotoUrl) {
    return (
      <section
        aria-label="Sampul undangan"
        className="relative flex min-h-screen flex-col items-center justify-center px-8 py-20"
        style={coverPhotoTextStyle(coverPhotoUrl)}
      >
        <CoverPhotoLayer imageUrl={coverPhotoUrl} />
        <div className="pointer-events-none absolute inset-4 border border-white/40" />
        <Corners inset="far" size="size-12" />
        {content}
      </section>
    );
  }

  return (
    <section aria-label="Sampul undangan">
      <Band className="relative flex min-h-screen flex-col items-center justify-center px-8 py-20">
        <div className="pointer-events-none absolute inset-4 border border-[color:var(--ii-accent)]/50" />
        <div className="pointer-events-none absolute inset-6 border border-[color:var(--ii-accent)]/25" />
        <Corners inset="far" size="size-12" />
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
        <div className="mx-auto mt-12 flex max-w-lg flex-col items-center gap-6">
          {identity.members.map((member, index) => (
            <Fragment key={`${index}-${member.name}`}>
              {index > 0 && identity.pairMembers && (
                <span
                  aria-hidden="true"
                  className="text-5xl text-[color:var(--ii-accent)]"
                  style={{ fontFamily: "var(--ii-heading-font)" }}
                >
                  &amp;
                </span>
              )}
              <div className="flex flex-col items-center">
                <div className="rounded-t-full border border-[color:var(--ii-accent)]/50 p-2 empty:hidden">
                  <MemberPhoto member={member} shape="arch" />
                </div>
                {member.role && (
                  <p className="mt-4 text-[11px] tracking-[0.35em] text-[color:var(--ii-accent)] uppercase">
                    {member.role}
                  </p>
                )}
                <p
                  className="mt-1 text-3xl text-[color:var(--ii-primary)]"
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
        <ul className="mx-auto mt-10 max-w-md space-y-2 text-sm tracking-wide text-[color:var(--ii-text)] opacity-80">
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
      <Band className="px-6 py-20">
        <h2 id="schedule-heading" className="sr-only">
          Rangkaian Acara
        </h2>
        <SectionTitle>Rangkaian Acara</SectionTitle>
        <div className="mx-auto mt-12 flex max-w-md flex-col gap-8">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="relative border border-[color:var(--ii-accent)]/70 p-1.5 text-center"
            >
              <div className="relative border border-[color:var(--ii-accent)]/35 px-6 py-9">
                <Corners size="size-7" />
                <p
                  className="text-2xl text-[color:var(--ii-primary)]"
                  style={{ fontFamily: "var(--ii-heading-font)" }}
                >
                  {schedule.title}
                </p>
                <Swag className="my-4 w-36" />
                <p className="text-sm tracking-[0.2em] text-[color:var(--ii-text)] uppercase">
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
                  <div className="mt-5 space-y-1 text-sm">
                    <p className="font-medium text-[color:var(--ii-primary)]">
                      {schedule.venue.name}
                    </p>
                    <p className="text-[color:var(--ii-text)] opacity-85">
                      {schedule.venue.address}
                    </p>
                  </div>
                )}
                <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs tracking-[0.2em] uppercase">
                  <a
                    href={buildGoogleCalendarUrl(schedule)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[color:var(--ii-accent)] px-4 py-2 text-[color:var(--ii-text)] transition-colors hover:bg-[color:var(--ii-accent)]/20"
                  >
                    Simpan Tanggal
                  </a>
                  {schedule.venue?.mapUrl && (
                    <a
                      href={schedule.venue.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-[color:var(--ii-accent)] px-4 py-2 text-[color:var(--ii-text)] transition-colors hover:bg-[color:var(--ii-accent)]/20"
                    >
                      Buka Peta
                    </a>
                  )}
                </div>
              </div>
            </div>
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
      <ol className="relative mx-auto mt-12 flex max-w-md flex-col gap-12 text-center">
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-1/2 w-px -translate-x-1/2 bg-[color:var(--ii-accent)]/30"
        />
        {loveStory.items.map((item) => (
          <li key={item.id} className="relative bg-[color:var(--ii-background)] py-2">
            <span
              aria-hidden="true"
              className="mx-auto mb-4 block size-3 rotate-45 border border-[color:var(--ii-accent)] bg-[color:var(--ii-background)]"
            />
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="mx-auto mb-4 aspect-[4/5] w-44 rounded-t-full border border-[color:var(--ii-accent)]/50 object-cover p-1.5"
              />
            )}
            {item.dateLabel && (
              <p className="text-xs tracking-[0.35em] text-[color:var(--ii-accent)] uppercase">
                {item.dateLabel}
              </p>
            )}
            <p
              className="mt-2 text-xl text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
              {item.title}
            </p>
            {item.description && (
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[color:var(--ii-text)] opacity-80">
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
      <SectionTitle>Galeri</SectionTitle>
      {nonEmpty.map((gallery, index) => (
        <div
          key={index}
          className="relative mx-auto mt-12 max-w-xl border border-[color:var(--ii-accent)]/50 p-1.5"
        >
          <div className="border border-[color:var(--ii-accent)]/25 p-3">
            {gallery.title && (
              <p
                className="mb-4 text-center text-lg text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {gallery.title}
              </p>
            )}
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
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-6 text-[color:var(--ii-text)]">
        {giftMethods.map((method) => (
          <div
            key={method.id}
            className="relative border border-[color:var(--ii-accent)]/50 p-1.5 text-center text-sm"
          >
            <div className="relative border border-[color:var(--ii-accent)]/25 px-6 pt-10 pb-7">
              {/* A wax-seal medallion on the card's top edge. */}
              <span
                aria-hidden="true"
                className="absolute -top-5 left-1/2 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-[color:var(--ii-accent)] bg-[color:var(--ii-background)] text-[color:var(--ii-accent)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <rect x="3.5" y="8" width="17" height="12" rx="1" />
                  <path d="M3.5 12h17M12 8v12M12 8c-2-4-6-4-6-1.5S10 8 12 8Zm0 0c2-4 6-4 6-1.5S14 8 12 8Z" />
                </svg>
              </span>
              <p className="text-[11px] tracking-[0.35em] text-[color:var(--ii-accent)] uppercase">
                {GIFT_METHOD_TYPE_LABELS[method.type]}
              </p>
              <p
                className="mt-2 text-xl text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
              </p>
              {method.accountName && (
                <p className="mt-2 opacity-80">Atas nama: {method.accountName}</p>
              )}
              {method.accountNumber && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <span className="font-mono tracking-wider">{method.accountNumber}</span>
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
          <p className="border border-dashed border-[color:var(--ii-accent)]/50 p-5 text-center text-sm opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
        {wishes.length > 0 && (
          <ul className="space-y-4">
            {wishes.map((wish) => (
              <li
                key={wish.id}
                className="border-l-2 border-[color:var(--ii-accent)] bg-[color:var(--ii-secondary)]/30 px-5 py-4 text-left text-sm"
              >
                <p
                  className="text-base leading-relaxed whitespace-pre-wrap italic"
                  style={{ fontFamily: "var(--ii-heading-font)" }}
                >
                  {wish.message}
                </p>
                <p className="mt-3 text-xs tracking-[0.15em] opacity-70">
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

function Closing({ copy, initials }: { copy: InvitationCopy; initials: string }) {
  return (
    <section aria-label="Penutup">
      <Band className="relative flex min-h-[60vh] flex-col items-center justify-center px-8 py-20 text-center">
        <div className="pointer-events-none absolute inset-4 border border-[color:var(--ii-accent)]/40" />
        <Corners inset="far" />
        <Crest initials={initials} className="mb-8 size-24" />
        <p
          className="mx-auto max-w-lg text-2xl leading-relaxed text-balance text-[color:var(--ii-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {copy.closingMessage}
        </p>
        <Swag className="my-8" />
        <p className="text-xs tracking-[0.4em] text-[color:var(--ii-text)] uppercase opacity-80">
          {copy.closingThanks}
        </p>
      </Band>
    </section>
  );
}

export function RoyalGoldTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
        <Closing copy={copy} initials={monogramOf(getHeroHeading(invitation))} />
      </div>
    </main>
  );
}
