import { Fragment, useId, type CSSProperties, type ReactNode } from "react";
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
 * Traditional Jawa — a Javanese ceremonial composition, chosen by the
 * product owner as the attributed counterpart to Traditional Nusantara's
 * deliberately generic motifs (D-102). Its marks are drawn from Javanese
 * tradition: the gunungan (kayon) of wayang as the Hero's and Closing's
 * centerpiece and as the portrait frame, a truntum field (small star
 * blossoms, the batik worn by the couple's parents) behind the Hero, a
 * kawung lattice on the deep sogan-brown bands, and a parang strip along
 * card edges. Simplified, decorative renderings, not reproductions of a
 * specific batik or wayang piece. Text/background contrast is verified in
 * `lib/invitations/templates/default-themes.test.ts`; text on the bands
 * uses the theme's computed readable foreground.
 */

const BAND_STYLE = {
  background: "var(--ii-primary)",
  "--ii-band": "var(--ii-primary)",
} as CSSProperties;
const ON_BAND_VARS = {
  "--ii-text": "var(--primary-foreground)",
  "--ii-primary": "var(--primary-foreground)",
} as CSSProperties;

/** Gunungan outline, also used to clip portraits. */
const GUNUNGAN_CLIP =
  "polygon(50% 0, 64% 10%, 76% 24%, 88% 42%, 96% 60%, 100% 78%, 100% 100%, 0 100%, 0 78%, 4% 60%, 12% 42%, 24% 24%, 36% 10%)";

/**
 * A pattern id unique to this instance: the template can render several
 * times on one page (Homepage previews, the editor's template picker).
 */
function usePatternId(name: string): string {
  return `${name}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/** Kawung: four ovals around a point, tiled. */
function KawungPattern({ opacity = 0.14 }: { opacity?: number }) {
  const id = usePatternId("kawung");
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 size-full"
      style={{ opacity }}
    >
      <defs>
        <pattern id={id} width="36" height="36" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="var(--ii-accent)" strokeWidth="1.2">
            <ellipse cx="18" cy="8" rx="5" ry="7.5" />
            <ellipse cx="18" cy="28" rx="5" ry="7.5" />
            <ellipse cx="8" cy="18" rx="7.5" ry="5" />
            <ellipse cx="28" cy="18" rx="7.5" ry="5" />
          </g>
          <circle cx="18" cy="18" r="1.6" fill="var(--ii-accent)" />
          <circle cx="0" cy="0" r="1.6" fill="var(--ii-accent)" />
          <circle cx="36" cy="0" r="1.6" fill="var(--ii-accent)" />
          <circle cx="0" cy="36" r="1.6" fill="var(--ii-accent)" />
          <circle cx="36" cy="36" r="1.6" fill="var(--ii-accent)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Truntum: a field of small eight-point star blossoms. */
function TruntumPattern() {
  const id = usePatternId("truntum");
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 size-full opacity-[0.22]"
    >
      <defs>
        <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
          {[
            [11, 11],
            [33, 33],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} fill="var(--ii-accent)">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <ellipse
                  key={angle}
                  cx="0"
                  cy="-3.6"
                  rx="1.1"
                  ry="2.4"
                  transform={`rotate(${angle})`}
                />
              ))}
              <circle r="1.1" fill="var(--ii-primary)" />
            </g>
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Parang: diagonal S-curves in a narrow strip. */
function ParangStrip({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 12"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-3 w-full ${className}`}
    >
      <rect width="160" height="12" fill="var(--ii-primary)" />
      {Array.from({ length: 16 }, (_, i) => (
        <path
          key={i}
          d={`M${i * 10 - 2} 12C${i * 10 + 2} 8 ${i * 10 + 2} 4 ${i * 10 + 6} 0`}
          fill="none"
          stroke="var(--ii-accent)"
          strokeWidth="2.2"
        />
      ))}
    </svg>
  );
}

/** The gunungan (kayon): a tall pointed silhouette with a tree of life and a gate at its foot. */
function Gunungan({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 160"
      aria-hidden="true"
      className={`text-[color:var(--ii-accent)] ${className}`}
    >
      <path
        d="M60 4C74 18 92 38 104 64 112 82 116 104 116 124H4C4 104 8 82 16 64 28 38 46 18 60 4Z"
        fill="currentColor"
        fillOpacity={0.12}
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <path
        d="M60 14C71 26 85 43 95 64 101 79 105 97 106 116H14C15 97 19 79 25 64 35 43 49 26 60 14Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.8}
        opacity={0.7}
      />
      {/* Tree of life: trunk with paired branches. */}
      <g fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round">
        <path d="M60 116V30" />
        {[44, 58, 72, 86, 100].map((y, i) => (
          <g key={y}>
            <path
              d={`M60 ${y}C${52 - i * 3} ${y - 4} ${46 - i * 4} ${y - 2} ${40 - i * 4} ${y + 6}`}
            />
            <path
              d={`M60 ${y}C${68 + i * 3} ${y - 4} ${74 + i * 4} ${y - 2} ${80 + i * 4} ${y + 6}`}
            />
          </g>
        ))}
      </g>
      <g fill="currentColor">
        {[36, 52, 66, 80, 94].map((y, i) => (
          <g key={y}>
            <circle cx={48 - i * 4} cy={y + 2} r="2" />
            <circle cx={72 + i * 4} cy={y + 2} r="2" />
          </g>
        ))}
      </g>
      {/* Gate at the foot. */}
      <path
        d="M44 124v-12h32v12M50 124v-7a10 10 0 0 1 20 0v7"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <path d="M30 124h60v8H30zM22 132h76v6H22z" fill="currentColor" />
    </svg>
  );
}

function Band({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div style={BAND_STYLE} className="relative isolate overflow-hidden">
      <KawungPattern />
      <div style={ON_BAND_VARS} className={className}>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Gunungan className="h-10 w-8" />
      <p
        className="text-center text-2xl tracking-wide text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {children}
      </p>
      <span
        aria-hidden="true"
        className="h-px w-24 bg-gradient-to-r from-transparent via-[color:var(--ii-accent)] to-transparent"
      />
    </div>
  );
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;

  return (
    <section
      aria-label="Sampul undangan"
      className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-8 py-20 text-center"
      style={coverPhotoTextStyle(coverPhotoUrl)}
    >
      <CoverPhotoLayer imageUrl={coverPhotoUrl} />
      {!coverPhotoUrl && <TruntumPattern />}
      <div className="absolute inset-x-0 top-0">
        <ParangStrip />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <ParangStrip />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-4">
        <Gunungan className="h-40 w-30" />
        <p className="mt-2 text-xs tracking-[0.45em] text-[color:var(--ii-accent)] uppercase">
          {EVENT_TYPE_LABELS[invitation.type]}
        </p>
        <h1
          className="text-4xl leading-tight text-balance text-[color:var(--ii-primary)] sm:text-5xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {getHeroHeading(invitation)}
        </h1>
        {heroDate && (
          <p className="text-sm tracking-[0.3em] text-[color:var(--ii-text)] uppercase">
            {formatIndonesianDate(heroDate)}
          </p>
        )}
        <div className="mt-6 w-full max-w-xs">
          <ParangStrip className="h-2" />
          <div
            className={`px-6 py-4 ${coverPhotoUrl ? "bg-black/30" : "bg-[color:var(--ii-background)]/85"}`}
          >
            <p className="text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-75">
              Kepada Yth.
            </p>
            <p className="mt-1 text-lg font-medium text-[color:var(--ii-primary)]">
              {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
            </p>
          </div>
          <ParangStrip className="h-2" />
        </div>
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
      <SectionTitle>{identity.heading}</SectionTitle>
      {identity.members.length > 0 && (
        <div className="mx-auto mt-12 flex max-w-lg flex-col items-center gap-10">
          {identity.members.map((member, index) => (
            <Fragment key={`${index}-${member.name}`}>
              {index > 0 && identity.pairMembers && (
                <span
                  aria-hidden="true"
                  className="text-4xl text-[color:var(--ii-accent)]"
                  style={{ fontFamily: "var(--ii-heading-font)" }}
                >
                  &amp;
                </span>
              )}
              <div className="flex w-full max-w-xs flex-col items-center">
                {member.photoUrl && (
                  <div
                    style={{ clipPath: GUNUNGAN_CLIP }}
                    className="bg-[color:var(--ii-accent)] p-[3px]"
                  >
                    <div
                      style={{ clipPath: GUNUNGAN_CLIP }}
                      className="h-56 w-44 bg-[color:var(--ii-secondary)]"
                    >
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
                )}
                {member.role && (
                  <p className="mt-5 text-[11px] tracking-[0.35em] text-[color:var(--ii-accent)] uppercase">
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
      <Band className="px-6 py-20">
        <h2 id="schedule-heading" className="sr-only">
          Rangkaian Acara
        </h2>
        <SectionTitle>Rangkaian Acara</SectionTitle>
        <div className="mx-auto mt-10 flex max-w-md flex-col gap-6">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="overflow-hidden border border-[color:var(--ii-accent)]/70 text-center"
            >
              <ParangStrip />
              <div className="px-6 py-8" style={{ background: "var(--ii-band)" }}>
                <p
                  className="text-2xl text-[color:var(--ii-primary)]"
                  style={{ fontFamily: "var(--ii-heading-font)" }}
                >
                  {schedule.title}
                </p>
                <p className="mt-4 text-sm tracking-[0.2em] text-[color:var(--ii-text)] uppercase">
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
                    className="bg-[color:var(--ii-text)] px-5 py-2 font-medium text-[color:var(--ii-band)] transition-opacity hover:opacity-90"
                  >
                    Simpan Tanggal
                  </a>
                  {schedule.venue?.mapUrl && (
                    <a
                      href={schedule.venue.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-[color:var(--ii-accent)] px-5 py-2 text-[color:var(--ii-text)] transition-colors hover:bg-[color:var(--ii-accent)]/20"
                    >
                      Buka Peta
                    </a>
                  )}
                </div>
              </div>
              <ParangStrip />
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
      <ol className="mx-auto mt-12 flex max-w-md flex-col">
        {loveStory.items.map((item, index) => (
          <li key={item.id} className="relative flex gap-5 pb-10 last:pb-0">
            {index < loveStory.items.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-9 bottom-0 left-[17px] w-px bg-[color:var(--ii-accent)]/50"
              />
            )}
            {/* A single kawung blossom as the timeline node. */}
            <svg
              viewBox="0 0 36 36"
              aria-hidden="true"
              className="size-9 shrink-0 text-[color:var(--ii-accent)]"
            >
              <g fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={1.2}>
                <ellipse cx="18" cy="8" rx="5" ry="7.5" />
                <ellipse cx="18" cy="28" rx="5" ry="7.5" />
                <ellipse cx="8" cy="18" rx="7.5" ry="5" />
                <ellipse cx="28" cy="18" rx="7.5" ry="5" />
              </g>
              <circle cx="18" cy="18" r="2" fill="currentColor" />
            </svg>
            <div className="min-w-0 flex-1">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="mb-4 aspect-[4/3] w-full border border-[color:var(--ii-accent)]/50 object-cover p-1"
                />
              )}
              {item.dateLabel && (
                <p className="text-xs tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
                  {item.dateLabel}
                </p>
              )}
              <p
                className="mt-1 text-xl text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--ii-text)] opacity-85">
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
          <div className="border border-[color:var(--ii-accent)]/60">
            <ParangStrip />
            <div className="p-2">
              <GalleryGrid items={gallery.items} />
            </div>
            <ParangStrip />
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
            className="overflow-hidden border border-[color:var(--ii-accent)]/60 text-center text-sm"
          >
            <ParangStrip />
            <div className="px-6 py-7">
              <p className="text-xs tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
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
          <p className="border border-dashed border-[color:var(--ii-accent)]/60 p-5 text-center text-sm opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
        {wishes.length > 0 && (
          <ul className="space-y-3">
            {wishes.map((wish) => (
              <li
                key={wish.id}
                className="border-l-2 border-[color:var(--ii-accent)] bg-[color:var(--ii-secondary)]/40 px-5 py-4 text-sm"
              >
                <p className="leading-relaxed whitespace-pre-wrap">{wish.message}</p>
                <p className="mt-2 text-xs font-medium text-[color:var(--ii-primary)]">
                  {wish.name}{" "}
                  <span className="font-normal opacity-70">
                    · {formatIndonesianDateTime(wish.createdAt)}
                  </span>
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
    <section aria-label="Penutup">
      <Band className="flex min-h-[60vh] flex-col items-center justify-center px-8 py-20 text-center">
        <Gunungan className="mb-8 h-28 w-22" />
        <p
          className="mx-auto max-w-lg text-xl leading-relaxed text-balance text-[color:var(--ii-primary)] sm:text-2xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {copy.closingMessage}
        </p>
        <span
          aria-hidden="true"
          className="my-8 h-px w-24 bg-gradient-to-r from-transparent via-[color:var(--ii-accent)] to-transparent"
        />
        <p className="text-xs tracking-[0.35em] text-[color:var(--ii-text)] uppercase opacity-85">
          {copy.closingThanks}
        </p>
      </Band>
    </section>
  );
}

export function TraditionalJawaTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
