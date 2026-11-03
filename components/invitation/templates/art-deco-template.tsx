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
 * Art Deco — 1920s geometry, strictly angular: a radiating sunburst over the
 * Hero, chamfered (cut-corner) panels, octagonal portraits, stepped chevron
 * rules and widely tracked capitals, on bands in the theme's primary color
 * (black by default) framed by thin vertical "pillar" rules. Royal Gold, its
 * nearest neighbor, is the opposite: curled ornaments, arches and a crest.
 * Never a curved line here. Text/background contrast is verified in
 * `lib/invitations/templates/default-themes.test.ts`; text on the primary
 * bands uses the theme's computed readable foreground.
 */

// `--ii-band` keeps the band color for panels inside it, after the inner
// element rescopes `--ii-primary` to the readable foreground.
const BAND_STYLE = {
  background: "var(--ii-primary)",
  "--ii-band": "var(--ii-primary)",
} as CSSProperties;
const ON_BAND_VARS = {
  "--ii-text": "var(--primary-foreground)",
  "--ii-primary": "var(--primary-foreground)",
} as CSSProperties;

/** Cut corners, the template's signature shape. */
const CHAMFER =
  "polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)";
const OCTAGON = "polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)";

function Band({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div style={BAND_STYLE} className="relative isolate overflow-hidden">
      <Pillars />
      <div style={ON_BAND_VARS} className={className}>
        {children}
      </div>
    </div>
  );
}

/** Thin vertical gold rules down both edges of a band. */
function Pillars() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-4 inset-y-0 flex justify-between"
    >
      <span className="flex gap-1">
        <span className="w-px bg-[color:var(--ii-accent)]/70" />
        <span className="w-px bg-[color:var(--ii-accent)]/35" />
      </span>
      <span className="flex gap-1">
        <span className="w-px bg-[color:var(--ii-accent)]/35" />
        <span className="w-px bg-[color:var(--ii-accent)]/70" />
      </span>
    </div>
  );
}

/** A chamfered panel with a thin accent outline (outer clip in accent, inner clip in `fill`). */
function DecoPanel({
  children,
  className = "",
  fill = "var(--ii-background)",
}: {
  children: ReactNode;
  className?: string;
  fill?: string;
}) {
  return (
    <div style={{ clipPath: CHAMFER }} className="bg-[color:var(--ii-accent)] p-px">
      <div style={{ clipPath: CHAMFER, background: fill }} className={className}>
        {children}
      </div>
    </div>
  );
}

/** A radiating half-sunburst. */
function Sunburst({ className = "" }: { className?: string }) {
  const rays = Array.from({ length: 13 }, (_, i) => (i * 180) / 12);
  return (
    <svg
      viewBox="0 0 200 104"
      aria-hidden="true"
      className={`mx-auto text-[color:var(--ii-accent)] ${className}`}
      fill="none"
      stroke="currentColor"
    >
      {rays.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <line
            key={angle}
            x1={100 + 22 * Math.cos(rad)}
            y1={100 - 22 * Math.sin(rad)}
            x2={100 + 96 * Math.cos(rad)}
            y2={100 - 96 * Math.sin(rad)}
            strokeWidth={angle % 30 === 0 ? 1.25 : 0.6}
          />
        );
      })}
      <path d="M78 100a22 22 0 0 1 44 0" strokeWidth={1.25} />
      <path d="M86 100a14 14 0 0 1 28 0" fill="currentColor" fillOpacity={0.35} strokeWidth={0} />
      <line x1="0" y1="100" x2="200" y2="100" strokeWidth={1.25} />
    </svg>
  );
}

/** A stepped chevron rule. */
function Chevrons({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 16"
      aria-hidden="true"
      className={`mx-auto h-4 w-40 text-[color:var(--ii-accent)] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path d="M0 8h52M108 8h52" />
      <path d="M58 8l6-6 6 6-6 6zM90 8l6-6 6 6-6 6z" />
      <path d="M74 8l6-6 6 6-6 6z" fill="currentColor" />
    </svg>
  );
}

/** Section title: capitals between stepped brackets. */
function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span aria-hidden="true" className="flex flex-col items-end gap-1">
        <span className="h-px w-10 bg-[color:var(--ii-accent)]" />
        <span className="h-px w-6 bg-[color:var(--ii-accent)]" />
      </span>
      <p
        className="text-center text-sm tracking-[0.45em] text-[color:var(--ii-primary)] uppercase"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {children}
      </p>
      <span aria-hidden="true" className="flex flex-col items-start gap-1">
        <span className="h-px w-10 bg-[color:var(--ii-accent)]" />
        <span className="h-px w-6 bg-[color:var(--ii-accent)]" />
      </span>
    </div>
  );
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;

  const content = (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center text-center">
      <Sunburst className="h-auto w-64" />
      <p className="mt-8 text-[11px] font-medium tracking-[0.6em] text-[color:var(--ii-accent)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>
      <h1
        className="mt-5 max-w-sm text-4xl leading-tight tracking-[0.12em] text-balance text-[color:var(--ii-primary)] uppercase sm:text-5xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {getHeroHeading(invitation)}
      </h1>
      <Chevrons className="mt-6" />
      {heroDate && (
        <p className="mt-6 border-y border-[color:var(--ii-accent)]/70 px-6 py-2 text-sm tracking-[0.4em] text-[color:var(--ii-text)] uppercase">
          {formatIndonesianDate(heroDate)}
        </p>
      )}
      <div className="mt-10">
        <p className="text-[11px] tracking-[0.45em] text-[color:var(--ii-accent)] uppercase">
          Kepada Yth.
        </p>
        <p className="mt-2 text-lg tracking-wide text-[color:var(--ii-primary)]">
          {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
        </p>
      </div>
    </div>
  );

  if (coverPhotoUrl) {
    return (
      <section
        aria-label="Sampul undangan"
        className="relative flex min-h-screen flex-col items-center justify-center px-10 py-20"
        style={coverPhotoTextStyle(coverPhotoUrl)}
      >
        <CoverPhotoLayer imageUrl={coverPhotoUrl} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 inset-y-0 flex justify-between"
        >
          <span className="w-px bg-white/50" />
          <span className="w-px bg-white/50" />
        </div>
        {content}
      </section>
    );
  }

  return (
    <section aria-label="Sampul undangan">
      <Band className="relative flex min-h-screen flex-col items-center justify-center px-10 py-20">
        {content}
      </Band>
    </section>
  );
}

function Identity({ identity }: { identity: PublicIdentity }) {
  return (
    <section aria-labelledby="identity-heading" className="px-8 py-20 text-center">
      <h2 id="identity-heading" className="sr-only">
        {identity.heading}
      </h2>
      <SectionTitle>{identity.heading}</SectionTitle>
      {identity.members.length > 0 && (
        <div className="mx-auto mt-12 flex max-w-lg flex-col items-center gap-10">
          {identity.members.map((member, index) => (
            <Fragment key={`${index}-${member.name}`}>
              {index > 0 && identity.pairMembers && (
                <span aria-hidden="true" className="flex items-center gap-3">
                  <span className="h-px w-16 bg-[color:var(--ii-accent)]" />
                  <span className="size-2.5 rotate-45 bg-[color:var(--ii-accent)]" />
                  <span className="h-px w-16 bg-[color:var(--ii-accent)]" />
                </span>
              )}
              <div className="flex flex-col items-center">
                {member.photoUrl && (
                  <div
                    style={{ clipPath: OCTAGON }}
                    className="mb-5 bg-[color:var(--ii-accent)] p-[3px]"
                  >
                    <div
                      style={{ clipPath: OCTAGON }}
                      className="[&>div]:mb-0 [&>div]:size-36 [&>div]:rounded-none [&>div]:border-0"
                    >
                      <MemberPhoto member={member} shape="square" />
                    </div>
                  </div>
                )}
                {member.role && (
                  <p className="text-[11px] tracking-[0.45em] text-[color:var(--ii-accent)] uppercase">
                    {member.role}
                  </p>
                )}
                <p
                  className="mt-2 text-2xl tracking-[0.12em] text-[color:var(--ii-primary)] uppercase"
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
                    className="mt-2 text-xs tracking-[0.2em] text-[color:var(--ii-text)] uppercase underline-offset-2 opacity-70 hover:underline"
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
        <ul className="mx-auto mt-10 max-w-md space-y-2 text-xs tracking-[0.2em] text-[color:var(--ii-text)] uppercase opacity-80">
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
      <Band className="px-10 py-20">
        <h2 id="schedule-heading" className="sr-only">
          Rangkaian Acara
        </h2>
        <SectionTitle>Rangkaian Acara</SectionTitle>
        <div className="mx-auto mt-12 flex max-w-md flex-col gap-8">
          {schedules.map((schedule) => (
            <DecoPanel key={schedule.id} fill="var(--ii-band)" className="px-6 py-9 text-center">
              <p
                className="text-xl tracking-[0.15em] text-[color:var(--ii-primary)] uppercase"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {schedule.title}
              </p>
              <Chevrons className="my-5" />
              <p className="text-sm tracking-[0.3em] text-[color:var(--ii-text)] uppercase">
                {formatIndonesianDate(schedule.date)}
              </p>
              <p className="mt-1 text-sm tracking-widest text-[color:var(--ii-text)] opacity-85">
                {formatTimeRange(schedule.startTime, schedule.endTime)}
              </p>
              {schedule.description && (
                <p className="mt-3 text-sm text-[color:var(--ii-text)] opacity-85">
                  {schedule.description}
                </p>
              )}
              {schedule.venue && (
                <div className="mt-5 space-y-1 text-sm">
                  <p className="tracking-[0.15em] text-[color:var(--ii-primary)] uppercase">
                    {schedule.venue.name}
                  </p>
                  <p className="text-[color:var(--ii-text)] opacity-85">{schedule.venue.address}</p>
                </div>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-[11px] tracking-[0.3em] uppercase">
                <a
                  href={buildGoogleCalendarUrl(schedule)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[color:var(--ii-accent)] px-4 py-2 font-semibold text-[color:var(--ii-band)] transition-opacity hover:opacity-85"
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
            </DecoPanel>
          ))}
        </div>
      </Band>
    </section>
  );
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function LoveStory({
  loveStory,
  defaultTitle,
}: {
  loveStory: PublicLoveStory | null;
  defaultTitle: string;
}) {
  if (!loveStory || loveStory.items.length === 0) return null;

  return (
    <section aria-labelledby="love-story-heading" className="px-8 py-20">
      <h2 id="love-story-heading" className="sr-only">
        {loveStory.title ?? defaultTitle}
      </h2>
      <SectionTitle>{loveStory.title ?? defaultTitle}</SectionTitle>
      <ol className="mx-auto mt-12 flex max-w-md flex-col gap-6">
        {loveStory.items.map((item, index) => (
          <li key={item.id} className="flex gap-5">
            <span
              aria-hidden="true"
              style={{ clipPath: OCTAGON }}
              className="flex size-12 shrink-0 items-center justify-center bg-[color:var(--ii-primary)] text-sm tracking-wider text-[color:var(--ii-accent)]"
            >
              {ROMAN[index] ?? index + 1}
            </span>
            <div className="min-w-0 flex-1 border-b border-[color:var(--ii-accent)]/40 pb-6">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  style={{ clipPath: CHAMFER }}
                  className="mb-4 aspect-[4/3] w-full object-cover"
                />
              )}
              {item.dateLabel && (
                <p className="text-[11px] tracking-[0.4em] text-[color:var(--ii-accent)] uppercase">
                  {item.dateLabel}
                </p>
              )}
              <p
                className="mt-1 text-lg tracking-[0.1em] text-[color:var(--ii-primary)] uppercase"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--ii-text)] opacity-80">
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
    <section aria-labelledby="gallery-heading">
      <Band className="px-10 py-20">
        <h2 id="gallery-heading" className="sr-only">
          Galeri
        </h2>
        <SectionTitle>Galeri</SectionTitle>
        {nonEmpty.map((gallery, index) => (
          <div key={index} className="mx-auto mt-12 max-w-xl">
            {gallery.title && (
              <p className="mb-4 text-center text-sm tracking-[0.3em] text-[color:var(--ii-primary)] uppercase">
                {gallery.title}
              </p>
            )}
            <div className="border border-[color:var(--ii-accent)]/60 p-2">
              <GalleryGrid items={gallery.items} />
            </div>
          </div>
        ))}
      </Band>
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
    <section aria-labelledby="rsvp-heading" className="px-8 py-20">
      <h2 id="rsvp-heading" className="sr-only">
        RSVP
      </h2>
      <SectionTitle>Konfirmasi Kehadiran</SectionTitle>
      <div className="mx-auto mt-10 max-w-md">
        <RsvpSection eventId={eventId} rsvp={rsvp} embedded />
      </div>
    </section>
  );
}

function Gift({ giftMethods }: { giftMethods: PublicGiftMethod[] }) {
  if (giftMethods.length === 0) return null;

  return (
    <section aria-labelledby="gift-heading" className="px-8 py-20">
      <h2 id="gift-heading" className="sr-only">
        Kirim Hadiah
      </h2>
      <SectionTitle>Kirim Hadiah</SectionTitle>
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-6 text-[color:var(--ii-text)]">
        {giftMethods.map((method) => (
          <DecoPanel key={method.id} className="px-6 py-8 text-center text-sm">
            <p className="text-[11px] tracking-[0.45em] text-[color:var(--ii-accent)] uppercase">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <p
              className="mt-2 text-lg tracking-[0.15em] text-[color:var(--ii-primary)] uppercase"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
              {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            {method.accountName && (
              <p className="mt-2 opacity-80">Atas nama: {method.accountName}</p>
            )}
            {method.accountNumber && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="bg-[color:var(--ii-primary)] px-3 py-1 font-mono tracking-[0.2em] text-[color:var(--primary-foreground)]">
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
          </DecoPanel>
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
    <section aria-labelledby="wishes-heading" className="px-8 py-20">
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
          <ul className="space-y-4">
            {wishes.map((wish) => (
              <li key={wish.id}>
                <DecoPanel className="px-6 py-5 text-sm">
                  <p className="leading-relaxed whitespace-pre-wrap">{wish.message}</p>
                  <p className="mt-3 text-[11px] tracking-[0.25em] uppercase opacity-70">
                    {wish.name} · {formatIndonesianDateTime(wish.createdAt)}
                  </p>
                </DecoPanel>
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
      <Band className="flex min-h-[60vh] flex-col items-center justify-center px-10 py-20 text-center">
        <Chevrons className="mb-10" />
        <p
          className="mx-auto max-w-lg text-xl leading-relaxed tracking-[0.08em] text-balance text-[color:var(--ii-primary)] uppercase sm:text-2xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {copy.closingMessage}
        </p>
        <p className="mt-10 text-[11px] tracking-[0.5em] text-[color:var(--ii-accent)] uppercase">
          {copy.closingThanks}
        </p>
        <Sunburst className="mt-10 h-auto w-48 rotate-180" />
      </Band>
    </section>
  );
}

export function ArtDecoTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
