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
  PublicIdentityMember,
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
 * Soft Romantic — dreamy and intimate: the whole page drifts through a
 * blush gradient, soft blurred color clouds float behind sections, content
 * sits on frosted translucent cards, and portraits are glowing circles that
 * overlap for a couple. Rounded type, generous radii, nothing sharp.
 * Decoration is only soft abstract shapes, never botanical or geometric
 * motifs (Phase 3 design audit §4.5 sets it apart from Floral Romance and
 * Traditional Nusantara). "Soft" comes from hue, not low contrast — see
 * `lib/invitations/templates/default-themes.test.ts`.
 */

/** A soft blurred cloud of color. */
function Cloud({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 rounded-full blur-3xl ${className}`}
    />
  );
}

/** A frosted, translucent card. */
function Glass({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[2rem] border border-white/70 bg-white/55 shadow-[0_10px_40px_-12px_color-mix(in_oklab,var(--ii-primary)_45%,transparent)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      {eyebrow && (
        <p className="rounded-full bg-[color:var(--ii-secondary)] px-3 py-1 text-[11px] font-medium tracking-[0.2em] text-[color:var(--ii-primary)] uppercase">
          {eyebrow}
        </p>
      )}
      <p
        className="text-3xl font-semibold text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {children}
      </p>
    </div>
  );
}

function GlowPhoto({
  member,
  className = "",
}: {
  member: PublicIdentityMember;
  className?: string;
}) {
  if (!member.photoUrl) return null;
  return (
    <div
      className={`overflow-hidden rounded-full border-4 border-white bg-[color:var(--ii-secondary)] shadow-[0_0_0_8px_color-mix(in_oklab,var(--ii-accent)_25%,transparent),0_18px_40px_-10px_color-mix(in_oklab,var(--ii-primary)_55%,transparent)] ${className}`}
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
  );
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;

  return (
    <section
      aria-label="Sampul undangan"
      className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      style={coverPhotoTextStyle(coverPhotoUrl)}
    >
      <CoverPhotoLayer imageUrl={coverPhotoUrl} />
      {!coverPhotoUrl && (
        <>
          <Cloud className="-top-20 -left-24 size-80 bg-[color:var(--ii-accent)]/45" />
          <Cloud className="top-1/3 -right-28 size-72 bg-[color:var(--ii-secondary)]" />
          <Cloud className="-bottom-24 left-1/4 size-72 bg-[color:var(--ii-primary)]/25" />
        </>
      )}
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4">
        <p className="rounded-full border border-current/20 px-4 py-1 text-[11px] font-medium tracking-[0.3em] text-[color:var(--ii-primary)] uppercase">
          {EVENT_TYPE_LABELS[invitation.type]}
        </p>
        <h1
          className="text-5xl leading-tight font-semibold text-balance text-[color:var(--ii-primary)]"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {getHeroHeading(invitation)}
        </h1>
        {heroDate && (
          <p className="text-sm font-medium tracking-[0.2em] text-[color:var(--ii-text)] uppercase">
            {formatIndonesianDate(heroDate)}
          </p>
        )}
        <div
          className={`mt-8 w-full rounded-[2rem] px-6 py-5 backdrop-blur-md ${
            coverPhotoUrl ? "bg-black/25" : "border border-white/70 bg-white/55 shadow-lg"
          }`}
        >
          <p className="text-xs tracking-[0.2em] text-[color:var(--ii-text)] uppercase opacity-75">
            Kepada Yth.
          </p>
          <p className="mt-1 text-lg font-semibold text-[color:var(--ii-primary)]">
            {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
          </p>
        </div>
      </div>
    </section>
  );
}

function MemberText({ member }: { member: PublicIdentityMember }) {
  return (
    <div className="flex flex-col items-center">
      {member.role && (
        <p className="text-[11px] font-medium tracking-[0.2em] text-[color:var(--ii-accent)] uppercase">
          {member.role}
        </p>
      )}
      <p
        className="mt-1 text-2xl font-semibold text-[color:var(--ii-primary)]"
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
          className="mt-2 rounded-full bg-[color:var(--ii-secondary)] px-3 py-1 text-xs text-[color:var(--ii-text)] hover:underline"
        >
          @{member.instagram}
        </a>
      )}
    </div>
  );
}

function Identity({ identity }: { identity: PublicIdentity }) {
  const pair = identity.pairMembers && identity.members.length === 2;
  const withPhotos = identity.members.filter((member) => member.photoUrl);

  return (
    <section
      aria-labelledby="identity-heading"
      className="relative isolate overflow-hidden px-6 py-20 text-center"
    >
      <Cloud className="top-10 -right-24 size-64 bg-[color:var(--ii-accent)]/30" />
      <h2 id="identity-heading" className="sr-only">
        {identity.heading}
      </h2>
      <SectionTitle>{identity.heading}</SectionTitle>
      {identity.members.length > 0 && (
        <div className="mx-auto mt-12 max-w-md">
          {pair ? (
            <>
              {withPhotos.length > 0 && (
                <div className="flex justify-center">
                  {identity.members.map((member, index) => (
                    <GlowPhoto
                      key={`${index}-${member.name}`}
                      member={member}
                      className={`size-36 ${index === 1 ? "-ml-6 translate-y-6" : ""}`}
                    />
                  ))}
                </div>
              )}
              <Glass className="mt-12 grid gap-6 px-6 py-8">
                {identity.members.map((member, index) => (
                  <Fragment key={`${index}-${member.name}`}>
                    {index > 0 && (
                      <span
                        aria-hidden="true"
                        className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-[color:var(--ii-accent)] to-transparent"
                      />
                    )}
                    <MemberText member={member} />
                  </Fragment>
                ))}
              </Glass>
            </>
          ) : (
            <div className="flex flex-col items-center gap-10">
              {identity.members.map((member, index) => (
                <div key={`${index}-${member.name}`} className="flex flex-col items-center gap-5">
                  <GlowPhoto member={member} className="size-40" />
                  <MemberText member={member} />
                </div>
              ))}
            </div>
          )}
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
    <section
      aria-labelledby="schedule-heading"
      className="relative isolate overflow-hidden px-6 py-20"
    >
      <Cloud className="top-1/4 -left-24 size-64 bg-[color:var(--ii-secondary)]" />
      <h2 id="schedule-heading" className="sr-only">
        Rangkaian Acara
      </h2>
      <SectionTitle eyebrow="Catat tanggalnya">Rangkaian Acara</SectionTitle>
      <div className="mx-auto mt-12 flex max-w-md flex-col gap-6">
        {schedules.map((schedule) => (
          <Glass key={schedule.id} className="px-7 py-8 text-center">
            <p
              className="text-2xl font-semibold text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
              {schedule.title}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
              <span className="rounded-full bg-[color:var(--ii-secondary)] px-4 py-1.5 text-[color:var(--ii-text)]">
                {formatIndonesianDate(schedule.date)}
              </span>
              <span className="rounded-full bg-[color:var(--ii-secondary)] px-4 py-1.5 text-[color:var(--ii-text)]">
                {formatTimeRange(schedule.startTime, schedule.endTime)}
              </span>
            </div>
            {schedule.description && (
              <p className="mt-4 text-sm text-[color:var(--ii-text)] opacity-80">
                {schedule.description}
              </p>
            )}
            {schedule.venue && (
              <div className="mt-5 space-y-1 text-sm">
                <p className="font-semibold text-[color:var(--ii-primary)]">
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
                className="rounded-full bg-[color:var(--ii-primary)] px-5 py-2.5 font-medium text-[color:var(--primary-foreground)] shadow-md transition-transform hover:-translate-y-0.5"
              >
                Simpan Tanggal
              </a>
              {schedule.venue?.mapUrl && (
                <a
                  href={schedule.venue.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/80 px-5 py-2.5 font-medium text-[color:var(--ii-primary)] shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  Buka Peta
                </a>
              )}
            </div>
          </Glass>
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
      <SectionTitle>{loveStory.title ?? defaultTitle}</SectionTitle>
      <ol className="mx-auto mt-12 flex max-w-md flex-col gap-4">
        {loveStory.items.map((item, index) => (
          <li key={item.id} className={index % 2 === 1 ? "pl-8" : "pr-8"}>
            <Glass className="px-6 py-5">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="mb-4 aspect-[4/3] w-full rounded-3xl object-cover"
                />
              )}
              <div className="flex items-baseline gap-3">
                {item.dateLabel && (
                  <span className="shrink-0 rounded-full bg-[color:var(--ii-primary)] px-3 py-0.5 text-xs font-medium text-[color:var(--primary-foreground)]">
                    {item.dateLabel}
                  </span>
                )}
                <p
                  className="text-lg font-semibold text-[color:var(--ii-primary)]"
                  style={{ fontFamily: "var(--ii-heading-font)" }}
                >
                  {item.title}
                </p>
              </div>
              {item.description && (
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--ii-text)] opacity-80">
                  {item.description}
                </p>
              )}
            </Glass>
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
      <Cloud className="right-0 bottom-10 size-72 bg-[color:var(--ii-accent)]/30" />
      <h2 id="gallery-heading" className="sr-only">
        Galeri
      </h2>
      <SectionTitle>Galeri</SectionTitle>
      {nonEmpty.map((gallery, index) => (
        <div key={index} className="mx-auto mt-12 max-w-xl">
          {gallery.title && (
            <p className="mb-4 text-center text-sm font-medium text-[color:var(--ii-primary)]">
              {gallery.title}
            </p>
          )}
          <Glass className="p-3">
            <GalleryGrid items={gallery.items} />
          </Glass>
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
        <RsvpSection eventId={eventId} rsvp={rsvp} embedded />
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
          <Glass key={method.id} className="px-6 py-7 text-center text-sm">
            <p className="text-[11px] font-medium tracking-[0.2em] text-[color:var(--ii-accent)] uppercase">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <p
              className="mt-1 text-xl font-semibold text-[color:var(--ii-primary)]"
              style={{ fontFamily: "var(--ii-heading-font)" }}
            >
              {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            {method.accountName && (
              <p className="mt-2 opacity-80">Atas nama: {method.accountName}</p>
            )}
            {method.accountNumber && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full bg-white/80 px-4 py-1.5 font-mono tracking-wider">
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
                className="mx-auto mt-4 h-40 w-40 rounded-3xl object-contain"
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
          </Glass>
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
      <div className="mx-auto mt-10 max-w-md space-y-6 text-[color:var(--ii-text)]">
        {guest ? (
          <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
        ) : (
          <Glass className="p-6 text-center text-sm opacity-90">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </Glass>
        )}
        {wishes.length > 0 && (
          <ul className="space-y-3">
            {wishes.map((wish) => (
              <li key={wish.id}>
                <Glass className="rounded-bl-md px-5 py-4 text-sm">
                  <p className="leading-relaxed whitespace-pre-wrap">{wish.message}</p>
                  <p className="mt-2 text-xs font-medium text-[color:var(--ii-primary)]">
                    {wish.name}{" "}
                    <span className="font-normal opacity-70">
                      · {formatIndonesianDateTime(wish.createdAt)}
                    </span>
                  </p>
                </Glass>
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
      <Cloud className="top-10 left-1/2 size-80 -translate-x-1/2 bg-[color:var(--ii-accent)]/35" />
      <p
        className="mx-auto max-w-md text-2xl leading-relaxed font-semibold text-balance text-[color:var(--ii-primary)]"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {copy.closingMessage}
      </p>
      <p className="mt-8 rounded-full bg-white/60 px-5 py-2 text-xs font-medium tracking-[0.2em] text-[color:var(--ii-text)] uppercase backdrop-blur-sm">
        {copy.closingThanks}
      </p>
    </section>
  );
}

export function SoftRomanticTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
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
      style={{
        ...themeToCssVars(invitation.theme),
        background:
          "linear-gradient(180deg, var(--ii-background) 0%, color-mix(in oklab, var(--ii-secondary) 70%, var(--ii-background)) 50%, var(--ii-background) 100%)",
      }}
      className="min-h-screen overflow-x-clip"
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
