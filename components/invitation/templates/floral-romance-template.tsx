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
 * Floral Romance — a garden of blooms: flower clusters spilling from the
 * Hero's corners, names in the theme's script font, petal-shaped portrait
 * frames (two opposite corners rounded), sprigs flanking every section
 * title and soft blush washes behind the page. Airy and centered, with
 * rounded "card" surfaces. Garden Tropical uses leaves on green bands;
 * Blue Bloom uses porcelain patterns; this one is flowers on blush. Text/
 * background contrast is verified in
 * `lib/invitations/templates/default-themes.test.ts`.
 */

/** A small five-petal flower. */
function Bloom({ x, y, r, rotate = 0 }: { x: number; y: number; r: number; rotate?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="0"
          cy={-r * 0.62}
          rx={r * 0.42}
          ry={r * 0.62}
          transform={`rotate(${angle})`}
          fill="var(--ii-accent)"
          fillOpacity={0.55}
        />
      ))}
      <circle r={r * 0.28} fill="var(--ii-primary)" fillOpacity={0.55} />
    </g>
  );
}

function Leaf({
  x,
  y,
  rotate,
  length = 22,
}: {
  x: number;
  y: number;
  rotate: number;
  length?: number;
}) {
  return (
    <path
      transform={`translate(${x} ${y}) rotate(${rotate})`}
      d={`M0 0C${length * 0.3} ${-length * 0.25} ${length * 0.75} ${-length * 0.25} ${length} 0C${length * 0.75} ${length * 0.25} ${length * 0.3} ${length * 0.25} 0 0Z`}
      fill="var(--ii-primary)"
      fillOpacity={0.22}
    />
  );
}

/** A cluster of blooms and leaves for a corner. */
function FlowerCorner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className={`pointer-events-none ${className}`}>
      <Leaf x={20} y={70} rotate={-30} length={40} />
      <Leaf x={60} y={20} rotate={60} length={40} />
      <Leaf x={70} y={70} rotate={20} length={34} />
      <Leaf x={30} y={110} rotate={-70} length={30} />
      <Leaf x={100} y={30} rotate={100} length={30} />
      <Bloom x={34} y={34} r={26} rotate={10} />
      <Bloom x={82} y={46} r={17} rotate={40} />
      <Bloom x={44} y={86} r={15} rotate={-20} />
      <Bloom x={110} y={18} r={10} />
      <Bloom x={16} y={124} r={9} rotate={30} />
    </svg>
  );
}

/** A sprig: a curved stem with leaves and a bud. */
function Sprig({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 60 24"
      aria-hidden="true"
      className={`h-6 w-14 ${flip ? "-scale-x-100" : ""} ${className}`}
    >
      <path
        d="M2 18C18 18 30 14 46 8"
        fill="none"
        stroke="var(--ii-primary)"
        strokeOpacity={0.45}
        strokeWidth={1}
      />
      <Leaf x={14} y={17} rotate={-40} length={10} />
      <Leaf x={24} y={15} rotate={20} length={9} />
      <Leaf x={32} y={12} rotate={-50} length={9} />
      <Bloom x={50} y={7} r={6} />
    </svg>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Sprig flip />
      <p
        className="text-center text-3xl text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-script-font)" }}
      >
        {children}
      </p>
      <Sprig />
    </div>
  );
}

/** Soft blush washes behind a section. */
function Wash({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-1/4 -z-10 size-72 rounded-full bg-[color:var(--ii-accent)]/15 blur-3xl ${
        side === "left" ? "-left-32" : "-right-32"
      }`}
    />
  );
}

/** Petal frame: two opposite corners fully rounded. */
const PETAL = "rounded-tl-[4.5rem] rounded-tr-xl rounded-br-[4.5rem] rounded-bl-xl";

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;

  return (
    <section
      aria-label="Sampul undangan"
      className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-8 py-24 text-center"
      style={coverPhotoTextStyle(coverPhotoUrl)}
    >
      <CoverPhotoLayer imageUrl={coverPhotoUrl} />
      {!coverPhotoUrl && <Wash side="left" />}
      <FlowerCorner className="absolute -top-4 -left-4 w-44" />
      <FlowerCorner className="absolute -right-4 -bottom-4 w-44 rotate-180" />
      <FlowerCorner className="absolute top-10 -right-10 w-24 rotate-90 opacity-70" />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-4">
        <p className="text-xs tracking-[0.4em] text-[color:var(--ii-accent)] uppercase">
          {EVENT_TYPE_LABELS[invitation.type]}
        </p>
        <h1
          className="text-6xl leading-tight text-balance text-[color:var(--ii-primary)]"
          style={{ fontFamily: "var(--ii-script-font)" }}
        >
          {getHeroHeading(invitation)}
        </h1>
        <Sprig className="w-20" />
        {heroDate && (
          <p className="text-sm tracking-[0.25em] text-[color:var(--ii-text)] uppercase">
            {formatIndonesianDate(heroDate)}
          </p>
        )}
        <div
          className={`mt-6 rounded-[2rem] border border-[color:var(--ii-accent)]/40 px-8 py-4 backdrop-blur-sm ${
            coverPhotoUrl ? "bg-black/25" : "bg-[color:var(--ii-background)]/70"
          }`}
        >
          <p className="text-xs tracking-[0.25em] text-[color:var(--ii-text)] uppercase opacity-75">
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
    <section
      aria-labelledby="identity-heading"
      className="relative isolate overflow-hidden px-6 py-20 text-center"
    >
      <Wash side="right" />
      <h2 id="identity-heading" className="sr-only">
        {identity.heading}
      </h2>
      <SectionTitle>{identity.heading}</SectionTitle>
      {identity.members.length > 0 && (
        <div className="mx-auto mt-12 flex max-w-lg flex-col items-center gap-8">
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
              <div className="relative flex flex-col items-center">
                {member.photoUrl && (
                  <div className="relative">
                    <div
                      className={`mx-auto h-52 w-40 overflow-hidden border-4 border-[color:var(--ii-background)] bg-[color:var(--ii-secondary)] shadow-lg ${PETAL}`}
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
                    <svg
                      viewBox="0 0 60 60"
                      aria-hidden="true"
                      className="absolute -right-5 -bottom-4 size-16"
                    >
                      <Leaf x={6} y={40} rotate={-40} length={22} />
                      <Bloom x={30} y={30} r={16} rotate={15} />
                    </svg>
                  </div>
                )}
                {member.role && (
                  <p className="mt-6 text-[11px] tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
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
    <section aria-labelledby="schedule-heading" className="px-6 py-20">
      <h2 id="schedule-heading" className="sr-only">
        Rangkaian Acara
      </h2>
      <SectionTitle>Rangkaian Acara</SectionTitle>
      <div className="mx-auto mt-12 flex max-w-md flex-col gap-10">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="relative rounded-[2.5rem] bg-[color:var(--ii-secondary)]/45 px-7 pt-12 pb-9 text-center shadow-sm"
          >
            <svg
              viewBox="0 0 80 40"
              aria-hidden="true"
              className="absolute -top-6 left-1/2 h-12 w-24 -translate-x-1/2"
            >
              <Leaf x={8} y={28} rotate={-20} length={24} />
              <Leaf x={72} y={28} rotate={200} length={24} />
              <Bloom x={40} y={22} r={16} />
            </svg>
            <p
              className="text-3xl text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-script-font)" }}
            >
              {schedule.title}
            </p>
            <p className="mt-4 text-sm tracking-[0.15em] text-[color:var(--ii-text)] uppercase">
              {formatIndonesianDate(schedule.date)}
            </p>
            <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-80">
              {formatTimeRange(schedule.startTime, schedule.endTime)}
            </p>
            {schedule.description && (
              <p className="mt-3 text-sm text-[color:var(--ii-text)] opacity-80">
                {schedule.description}
              </p>
            )}
            {schedule.venue && (
              <div className="mt-5 space-y-1 text-sm">
                <p className="font-medium text-[color:var(--ii-primary)]">{schedule.venue.name}</p>
                <p className="text-[color:var(--ii-text)] opacity-80">{schedule.venue.address}</p>
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
              <a
                href={buildGoogleCalendarUrl(schedule)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[color:var(--ii-primary)] px-5 py-2 text-[color:var(--primary-foreground)] shadow-sm transition-opacity hover:opacity-90"
              >
                Simpan Tanggal
              </a>
              {schedule.venue?.mapUrl && (
                <a
                  href={schedule.venue.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-[color:var(--ii-primary)]/40 px-5 py-2 text-[color:var(--ii-primary)] transition-colors hover:bg-[color:var(--ii-primary)]/10"
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
    <section
      aria-labelledby="love-story-heading"
      className="relative isolate overflow-hidden px-6 py-20"
    >
      <Wash side="left" />
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
                className="absolute top-10 bottom-0 left-5 border-l border-dashed border-[color:var(--ii-accent)]/60"
              />
            )}
            <svg viewBox="0 0 40 40" aria-hidden="true" className="size-10 shrink-0">
              <Bloom x={20} y={20} r={17} rotate={index * 25} />
            </svg>
            <div className="min-w-0 flex-1 pt-1">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className={`mb-4 aspect-[4/3] w-full object-cover ${PETAL}`}
                />
              )}
              {item.dateLabel && (
                <p className="text-xs tracking-[0.25em] text-[color:var(--ii-accent)] uppercase">
                  {item.dateLabel}
                </p>
              )}
              <p
                className="mt-1 text-2xl text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-script-font)" }}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--ii-text)] opacity-80">
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
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-6 text-[color:var(--ii-text)]">
        {giftMethods.map((method) => (
          <div
            key={method.id}
            className="rounded-[2rem] border border-[color:var(--ii-accent)]/35 bg-[color:var(--ii-background)] p-7 text-center text-sm shadow-sm"
          >
            <p className="text-xs tracking-[0.25em] text-[color:var(--ii-accent)] uppercase">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <p
              className="mt-1 text-3xl text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-script-font)" }}
            >
              {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            {method.accountName && (
              <p className="mt-2 opacity-80">Atas nama: {method.accountName}</p>
            )}
            {method.accountNumber && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full bg-[color:var(--ii-secondary)]/60 px-4 py-1.5 font-mono tracking-wider">
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
                className="mx-auto mt-4 h-40 w-40 rounded-2xl object-contain"
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
      <SectionTitle>Ucapan &amp; Doa</SectionTitle>
      <div className="mx-auto mt-10 max-w-md space-y-8 text-[color:var(--ii-text)]">
        {guest ? (
          <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
        ) : (
          <p className="rounded-[2rem] border border-dashed border-[color:var(--ii-accent)]/50 p-6 text-center text-sm opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
        {wishes.length > 0 && (
          <ul className="space-y-4">
            {wishes.map((wish) => (
              <li
                key={wish.id}
                className="rounded-[1.75rem] rounded-tl-md bg-[color:var(--ii-secondary)]/45 px-6 py-5 text-sm"
              >
                <p className="leading-relaxed whitespace-pre-wrap">{wish.message}</p>
                <p className="mt-3 text-xs opacity-70">
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
      className="relative isolate flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-8 py-24 text-center"
    >
      <FlowerCorner className="absolute -bottom-4 -left-4 w-36 -rotate-90" />
      <FlowerCorner className="absolute -top-4 -right-4 w-36 rotate-90" />
      <p
        className="mx-auto max-w-lg text-xl leading-relaxed text-balance text-[color:var(--ii-primary)] sm:text-2xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {copy.closingMessage}
      </p>
      <Sprig className="my-6 w-20" />
      <p
        className="text-3xl text-[color:var(--ii-accent)]"
        style={{ fontFamily: "var(--ii-script-font)" }}
      >
        {copy.closingThanks}
      </p>
    </section>
  );
}

export function FloralRomanceTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
      className="min-h-screen overflow-x-clip bg-[color:var(--ii-background)]"
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
