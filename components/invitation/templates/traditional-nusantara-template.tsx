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
 * Traditional Nusantara — ceremonial and heritage-inspired: warm filled
 * surfaces, sawtooth borders along the bands' edges, a diamond lattice
 * behind the Hero, eight-point rosettes as the recurring mark, and carved-
 * panel cards with a stepped inner frame. Formal, structured pacing, with
 * bands in the theme's primary color (warm brown by default).
 *
 * The motifs are deliberately abstract/generic ("Nusantara-inspired
 * geometric pattern," per the Phase 3 design audit §4.4) — none is
 * presented as belonging to any specific named ethnic group, region or
 * textile tradition. The product owner chose to add attributed regional
 * motifs as their own template instead (Traditional Jawa, D-102), so this
 * one stays generic. Text/background contrast is verified in
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

/** A row of small triangles along a band's edge. */
function Sawtooth({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 8"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-2.5 w-full ${flip ? "rotate-180" : ""}`}
    >
      <path
        d={`M0 8${Array.from({ length: 20 }, (_, i) => `L${i * 6 + 3} 0L${i * 6 + 6} 8`).join("")}Z`}
        fill="var(--ii-accent)"
      />
    </svg>
  );
}

function Band({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div style={BAND_STYLE} className="relative isolate overflow-hidden">
      <Sawtooth flip />
      <div style={ON_BAND_VARS} className={className}>
        {children}
      </div>
      <Sawtooth />
    </div>
  );
}

/** An eight-point rosette. */
function Rosette({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={`text-[color:var(--ii-accent)] ${className}`}
    >
      <g fill="currentColor">
        <rect x="11" y="11" width="18" height="18" />
        <rect x="11" y="11" width="18" height="18" transform="rotate(45 20 20)" />
      </g>
      <circle cx="20" cy="20" r="6" fill="var(--ii-background)" />
      <circle cx="20" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}

/** A faint diamond lattice behind a section. */
function Lattice() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
      style={{
        backgroundImage:
          "linear-gradient(45deg, var(--ii-accent) 1px, transparent 1px), linear-gradient(-45deg, var(--ii-accent) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

/** A carved panel: an outer frame, then an inner frame with stepped corners. */
function CarvedPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="border-2 border-[color:var(--ii-accent)] bg-[color:var(--ii-background)] p-1.5">
      <div
        className={`relative border border-[color:var(--ii-accent)]/60 ${className}`}
        style={{
          clipPath:
            "polygon(10px 0, calc(100% - 10px) 0, calc(100% - 10px) 10px, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 10px calc(100% - 10px), 0 calc(100% - 10px), 0 10px, 10px 10px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span aria-hidden="true" className="flex items-center gap-2">
        <span className="h-px w-10 bg-[color:var(--ii-accent)]" />
        <Rosette className="size-6" />
        <span className="h-px w-10 bg-[color:var(--ii-accent)]" />
      </span>
      <p
        className="text-center text-2xl text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {children}
      </p>
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
      {!coverPhotoUrl && <Lattice />}
      <div className="absolute inset-x-0 top-0">
        <Sawtooth flip />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <Sawtooth />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-4">
        <Rosette className="size-12" />
        <p className="text-xs tracking-[0.4em] text-[color:var(--ii-accent)] uppercase">
          {EVENT_TYPE_LABELS[invitation.type]}
        </p>
        <h1
          className="text-4xl leading-tight text-balance text-[color:var(--ii-primary)] sm:text-5xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {getHeroHeading(invitation)}
        </h1>
        <span aria-hidden="true" className="flex items-center gap-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className={`rotate-45 bg-[color:var(--ii-accent)] ${i === 3 ? "size-2.5" : "size-1.5 opacity-70"}`}
            />
          ))}
        </span>
        {heroDate && (
          <p className="text-sm tracking-[0.25em] text-[color:var(--ii-text)] uppercase">
            {formatIndonesianDate(heroDate)}
          </p>
        )}
        <div className="mt-6 w-full max-w-xs border-y-2 border-double border-[color:var(--ii-accent)] py-4">
          <p className="text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-75">
            Kepada Yth.
          </p>
          <p className="mt-1 text-lg font-medium text-[color:var(--ii-primary)]">
            {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
          </p>
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
              {index > 0 && identity.pairMembers && <Rosette className="size-8" />}
              <div className="flex w-full max-w-xs flex-col items-center">
                {member.photoUrl && (
                  <div className="border-2 border-[color:var(--ii-accent)] p-1">
                    <div className="h-52 w-40 overflow-hidden rounded-t-[5rem] bg-[color:var(--ii-secondary)]">
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
      <Band className="px-6 py-16">
        <h2 id="schedule-heading" className="sr-only">
          Rangkaian Acara
        </h2>
        <SectionTitle>Rangkaian Acara</SectionTitle>
        <div className="mx-auto mt-10 flex max-w-md flex-col gap-6">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="border border-[color:var(--ii-accent)]/70 p-1 text-center"
            >
              <div className="border border-[color:var(--ii-accent)]/40 px-6 py-8">
                <p
                  className="text-2xl text-[color:var(--ii-primary)]"
                  style={{ fontFamily: "var(--ii-heading-font)" }}
                >
                  {schedule.title}
                </p>
                <div className="mx-auto my-4 flex w-fit items-center gap-2">
                  <span className="h-px w-8 bg-[color:var(--ii-accent)]" />
                  <span className="size-1.5 rotate-45 bg-[color:var(--ii-accent)]" />
                  <span className="h-px w-8 bg-[color:var(--ii-accent)]" />
                </div>
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
      <ol className="mx-auto mt-12 flex max-w-md flex-col gap-6">
        {loveStory.items.map((item) => (
          <li key={item.id}>
            <CarvedPanel className="bg-[color:var(--ii-secondary)]/35 px-6 py-6 text-center">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="mx-auto mb-4 aspect-[4/3] w-full object-cover"
                />
              )}
              {item.dateLabel && (
                <p className="mx-auto w-fit bg-[color:var(--ii-primary)] px-3 py-0.5 text-xs tracking-[0.25em] text-[color:var(--primary-foreground)]">
                  {item.dateLabel}
                </p>
              )}
              <p
                className="mt-3 text-xl text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--ii-text)] opacity-85">
                  {item.description}
                </p>
              )}
            </CarvedPanel>
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
      className="relative isolate overflow-hidden bg-[color:var(--ii-secondary)]/35 px-6 py-20"
    >
      <Lattice />
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
          <div className="border-2 border-[color:var(--ii-accent)] bg-[color:var(--ii-background)] p-2">
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
          <CarvedPanel key={method.id} className="px-6 py-8 text-center text-sm">
            <Rosette className="mx-auto mb-3 size-7" />
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
          </CarvedPanel>
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
          <p className="border-2 border-dashed border-[color:var(--ii-accent)]/60 p-5 text-center text-sm opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
        {wishes.length > 0 && (
          <ul className="divide-y divide-[color:var(--ii-accent)]/30 border-y border-[color:var(--ii-accent)]/30">
            {wishes.map((wish) => (
              <li key={wish.id} className="flex gap-3 py-4 text-sm">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rotate-45 bg-[color:var(--ii-accent)]"
                />
                <div className="min-w-0">
                  <p className="leading-relaxed whitespace-pre-wrap">{wish.message}</p>
                  <p className="mt-2 text-xs font-medium text-[color:var(--ii-primary)]">
                    {wish.name}{" "}
                    <span className="font-normal opacity-70">
                      · {formatIndonesianDateTime(wish.createdAt)}
                    </span>
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
      <Band className="flex min-h-[60vh] flex-col items-center justify-center px-8 py-20 text-center">
        <Rosette className="mb-8 size-14" />
        <p
          className="mx-auto max-w-lg text-xl leading-relaxed text-balance text-[color:var(--ii-primary)] sm:text-2xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {copy.closingMessage}
        </p>
        <span aria-hidden="true" className="my-8 flex items-center gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="size-1.5 rotate-45 bg-[color:var(--ii-accent)]" />
          ))}
        </span>
        <p className="text-xs tracking-[0.35em] text-[color:var(--ii-text)] uppercase opacity-85">
          {copy.closingThanks}
        </p>
      </Band>
    </section>
  );
}

export function TraditionalNusantaraTemplate({
  invitation,
  rsvp,
  wishGuest,
}: InvitationTemplateProps) {
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
