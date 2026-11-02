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

/** Portrait frame: a gunungan silhouette, full enough at the top to keep a face in frame. */
const GUNUNGAN_CLIP =
  "polygon(50% 0, 66% 7%, 80% 18%, 91% 34%, 98% 52%, 100% 70%, 100% 100%, 0 100%, 0 70%, 2% 52%, 9% 34%, 20% 18%, 34% 7%)";

type Point = { x: number; y: number; angle: number };

/**
 * Points along the right edge of the gunungan (a cubic curve from the base
 * to the apex), each with the angle of the outward normal, for the flame
 * fringe. Computed once; the left edge mirrors it.
 */
const GUNUNGAN_FRINGE: Point[] = (() => {
  const p0 = { x: 110, y: 124 };
  const p1 = { x: 110, y: 88 };
  const p2 = { x: 88, y: 40 };
  const p3 = { x: 60, y: 8 };
  const points: Point[] = [];
  for (let i = 1; i < 14; i++) {
    const t = i / 14;
    const u = 1 - t;
    const x = u ** 3 * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t ** 3 * p3.x;
    const y = u ** 3 * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t ** 3 * p3.y;
    const dx = 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x);
    const dy = 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y);
    // The tangent runs up the curve; the outward normal is 90 degrees from it.
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    points.push({ x, y, angle });
  }
  return points;
})();

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

/**
 * Parang: rows of S-shaped curves running on the diagonal, with the small
 * lozenge (mlinjon) between rows. "dark" sits the motif on the primary
 * color; "light" is a quieter version on the page tint, used on the cover.
 */
function ParangStrip({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const ground =
    tone === "dark"
      ? "var(--ii-primary)"
      : "color-mix(in oklab, var(--ii-secondary) 70%, var(--ii-background))";
  return (
    <svg
      viewBox="0 0 160 20"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`block h-5 w-full ${className}`}
    >
      <rect width="160" height="20" fill={ground} />
      {Array.from({ length: 12 }, (_, i) => {
        const x = i * 16 - 8;
        return (
          <g key={i}>
            <path
              d={`M${x} 22C${x + 1} 15 ${x + 9} 16 ${x + 9} 10S${x + 16} 4 ${x + 18} -2`}
              fill="none"
              stroke="var(--ii-accent)"
              strokeWidth={3.2}
              strokeLinecap="round"
            />
            <path
              d={`M${x + 6} 22C${x + 7} 15 ${x + 15} 16 ${x + 15} 10S${x + 22} 4 ${x + 24} -2`}
              fill="none"
              stroke="var(--ii-accent)"
              strokeWidth={0.9}
              opacity={0.7}
            />
            <path
              d={`M${x + 12} 4l1.6 2-1.6 2-1.6-2z`}
              fill={tone === "dark" ? "var(--ii-accent)" : "var(--ii-primary)"}
            />
          </g>
        );
      })}
    </svg>
  );
}

const FLAME = "M0 -8C3.4 -4 3.6 0.6 0 3C-3.6 0.6 -3.4 -4 0 -8Z";
const GUNUNGAN_OUTLINE = "M60 8C88 40 110 88 110 124H10C10 88 32 40 60 8Z";

/**
 * The gunungan (kayon) of wayang, simplified for a decorative mark: a flame
 * fringe along the silhouette, an inner border, the tree of life with
 * curling (ukel) branches and a pair of birds, a crowning bud, and the
 * gate (gapura) with closed doors at its foot.
 */
function Gunungan({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="-6 -8 132 148"
      aria-hidden="true"
      className={`text-[color:var(--ii-accent)] ${className}`}
    >
      <g fill="currentColor">
        {GUNUNGAN_FRINGE.map((point, index) => (
          <g key={index}>
            <path
              d={FLAME}
              transform={`translate(${point.x} ${point.y}) rotate(${point.angle})`}
              opacity={0.85}
            />
            <path
              d={FLAME}
              transform={`translate(${120 - point.x} ${point.y}) rotate(${-point.angle})`}
              opacity={0.85}
            />
          </g>
        ))}
        <path d={FLAME} transform="translate(60 2) scale(1.3)" />
      </g>
      <path
        d={GUNUNGAN_OUTLINE}
        fill="currentColor"
        fillOpacity={0.14}
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <path
        d={GUNUNGAN_OUTLINE}
        transform="translate(60 124) scale(0.86) translate(-60 -124)"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.8}
        strokeDasharray="1.5 2"
      />

      {/* Tree of life: a tapering trunk, curling branches, leaves. */}
      <path d="M58 104L59 30h2l1 74z" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round">
        {[38, 50, 62, 74, 86].map((y, i) => {
          const reach = 10 + i * 4;
          return (
            <g key={y}>
              <path
                d={`M60 ${y}C${56 - reach * 0.3} ${y - 6} ${60 - reach} ${y - 5} ${60 - reach} ${y + 1}a3 3 0 1 0 4 -2`}
              />
              <path
                d={`M60 ${y}C${64 + reach * 0.3} ${y - 6} ${60 + reach} ${y - 5} ${60 + reach} ${y + 1}a3 3 0 1 1 -4 -2`}
              />
            </g>
          );
        })}
      </g>
      <g fill="currentColor" fillOpacity={0.55}>
        {[38, 50, 62, 74, 86].map((y, i) => {
          const reach = 6 + i * 3;
          return (
            <g key={y}>
              <ellipse
                cx={60 - reach}
                cy={y - 5}
                rx="2.6"
                ry="1.3"
                transform={`rotate(-30 ${60 - reach} ${y - 5})`}
              />
              <ellipse
                cx={60 + reach}
                cy={y - 5}
                rx="2.6"
                ry="1.3"
                transform={`rotate(30 ${60 + reach} ${y - 5})`}
              />
            </g>
          );
        })}
      </g>
      {/* Two birds facing the trunk. */}
      <g fill="currentColor">
        <path d="M43 66c3-3 8-3 11 0-2 0-4 1-5 3-1-2-3-3-6-3z" />
        <path d="M77 66c-3-3-8-3-11 0 2 0 4 1 5 3 1-2 3-3 6-3z" />
      </g>
      <circle cx="60" cy="27" r="3" fill="currentColor" />

      {/* Gate (gapura): stepped roof, arched doorway, closed doors. */}
      <g fill="currentColor">
        <path d="M46 106h28l-3-4H49zM50 102h20l-3-4H53z" />
        <path d="M44 106h32v18H44z" fillOpacity={0.3} />
      </g>
      <path
        d="M44 124v-18h32v18M52 124v-9a8 8 0 0 1 16 0v9M60 115v9"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
      />
      <path d="M26 124h68v6H26zM18 130h84v6H18z" fill="currentColor" />
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

/** A single kawung blossom. */
function KawungMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      aria-hidden="true"
      className={`text-[color:var(--ii-accent)] ${className}`}
    >
      <g fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={1.2}>
        <ellipse cx="18" cy="8" rx="5" ry="7.5" />
        <ellipse cx="18" cy="28" rx="5" ry="7.5" />
        <ellipse cx="8" cy="18" rx="7.5" ry="5" />
        <ellipse cx="28" cy="18" rx="7.5" ry="5" />
      </g>
      <circle cx="18" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

/** A single truntum star blossom. */
function TruntumMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`text-[color:var(--ii-accent)] ${className}`}
    >
      <g transform="translate(12 12)" fill="currentColor">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <ellipse key={angle} cx="0" cy="-6.5" rx="1.8" ry="4" transform={`rotate(${angle})`} />
        ))}
        <circle r="2" />
      </g>
    </svg>
  );
}

type TitleMark = "gunungan" | "kawung" | "truntum";

/**
 * Section title. The ornament above it changes by section (gunungan,
 * kawung or truntum), so the page does not repeat one opener all the way
 * down.
 */
function SectionTitle({ children, mark = "kawung" }: { children: ReactNode; mark?: TitleMark }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {mark === "gunungan" && <Gunungan className="h-14 w-12" />}
      {mark === "kawung" && <KawungMark className="size-8" />}
      {mark === "truntum" && (
        <span aria-hidden="true" className="flex items-center gap-2">
          <TruntumMark className="size-3 opacity-70" />
          <TruntumMark className="size-5" />
          <TruntumMark className="size-3 opacity-70" />
        </span>
      )}
      <p
        className="text-center text-3xl tracking-wide text-[color:var(--ii-primary)]"
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
        <ParangStrip tone={coverPhotoUrl ? "dark" : "light"} />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <ParangStrip tone={coverPhotoUrl ? "dark" : "light"} />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-4">
        <Gunungan className="h-48 w-36" />
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
          <ParangStrip tone="light" className="h-3" />
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
          <ParangStrip tone="light" className="h-3" />
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
      <SectionTitle mark="gunungan">{identity.heading}</SectionTitle>
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
                      className="h-60 w-48 bg-[color:var(--ii-secondary)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- our own uploaded storage object. */}
                      <img
                        src={member.photoUrl}
                        alt={`Foto ${member.name}`}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover object-[50%_25%]"
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
      <SectionTitle mark="truntum">{loveStory.title ?? defaultTitle}</SectionTitle>
      <ol className="mx-auto mt-12 flex max-w-md flex-col">
        {loveStory.items.map((item, index) => (
          <li key={item.id} className="relative flex gap-5 pb-10 last:pb-0">
            {index < loveStory.items.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-9 bottom-0 left-[17px] w-px bg-[color:var(--ii-accent)]/50"
              />
            )}
            <KawungMark className="size-9 shrink-0" />
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
      <SectionTitle mark="truntum">Galeri</SectionTitle>
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
      <SectionTitle mark="truntum">Kirim Hadiah</SectionTitle>
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
        <Gunungan className="mb-8 h-36 w-28" />
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
