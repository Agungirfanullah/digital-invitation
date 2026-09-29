import type { InvitationTemplateProps } from "@/lib/invitations/templates/registry";
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
import { getHeroHeading } from "@/lib/event-types/identity";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { GIFT_METHOD_TYPE_LABELS } from "@/lib/gifts/labels";
import {
  formatIndonesianDate,
  formatIndonesianDateTime,
  formatTimeRange,
} from "@/lib/invitations/format";
import { themeToCssVars } from "@/components/invitation/theme-vars";
import { GalleryGrid } from "@/components/invitation/sections/gallery-grid";
import { RsvpSection } from "@/components/rsvp/rsvp-section";
import { WishForm } from "@/components/wishes/wish-form";
import { CopyValueButton } from "@/components/gifts/copy-value-button";
import type { RsvpGuestView } from "@/lib/rsvp/types";

/**
 * Intimate, understated composition — a narrow content column, soft
 * tinted surfaces, one soft abstract shape as the only decoration (no
 * botanical or geometric motifs — see the Phase 3 design audit §4.5,
 * which explicitly distinguishes this from Floral Romance/Traditional
 * Nusantara). "Soft" is achieved through hue choice, not through
 * insufficient contrast — see `lib/invitations/templates/default-themes.test.ts`.
 */

function SoftShape({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="46" fill="var(--ii-accent)" opacity="0.18" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-xs font-medium tracking-[0.2em] text-[color:var(--ii-accent)] uppercase">
      {children}
    </p>
  );
}

function Hero({ invitation }: { invitation: PublicInvitation }) {
  const earliestSchedule = invitation.schedules[0];

  return (
    <section
      aria-label="Sampul undangan"
      className="relative flex min-h-[80vh] flex-col items-center justify-center gap-4 overflow-hidden px-6 py-16 text-center"
    >
      <SoftShape className="pointer-events-none absolute top-6 left-1/2 h-40 w-40 -translate-x-1/2" />
      <p className="relative text-xs font-medium tracking-[0.25em] text-[color:var(--ii-accent)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>
      <h1
        className="relative max-w-sm text-3xl font-medium text-balance text-[color:var(--ii-primary)] sm:text-4xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {getHeroHeading(invitation)}
      </h1>
      {earliestSchedule && (
        <p className="relative text-sm text-[color:var(--ii-text)]">
          {formatIndonesianDate(earliestSchedule.date)}
        </p>
      )}
      <div className="relative mt-4 space-y-1">
        <p className="text-xs tracking-wide text-[color:var(--ii-text)] uppercase opacity-70">
          Kepada Yth.
        </p>
        <p className="text-lg font-medium text-[color:var(--ii-primary)]">
          {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
        </p>
      </div>
    </section>
  );
}

function Identity({ identity }: { identity: PublicIdentity }) {
  return (
    <section aria-labelledby="identity-heading" className="mx-auto max-w-xs px-6 py-14 text-center">
      <h2 id="identity-heading" className="sr-only">
        {identity.heading}
      </h2>
      <SectionLabel>{identity.heading}</SectionLabel>
      <div className="mt-6 flex flex-col items-center gap-6">
        {identity.members.map((member, index) => (
          <div
            key={`${index}-${member.name}`}
            className="w-full rounded-3xl bg-[color:var(--ii-secondary)]/50 px-6 py-5"
          >
            <p className="text-xl font-medium text-[color:var(--ii-primary)]">{member.name}</p>
            {member.instagram && (
              <p className="mt-1 text-sm text-[color:var(--ii-text)] opacity-70">
                @{member.instagram}
              </p>
            )}
          </div>
        ))}
        {identity.details.length > 0 && (
          <ul className="space-y-1 text-sm text-[color:var(--ii-text)] opacity-80">
            {identity.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Schedule({ schedules }: { schedules: PublicSchedule[] }) {
  if (schedules.length === 0) return null;

  return (
    <section aria-labelledby="schedule-heading" className="mx-auto max-w-xs px-6 py-14">
      <h2 id="schedule-heading" className="sr-only">
        Rangkaian Acara
      </h2>
      <SectionLabel>Rangkaian Acara</SectionLabel>
      <ol className="mt-6 flex flex-col gap-4">
        {schedules.map((schedule) => (
          <li
            key={schedule.id}
            className="rounded-3xl bg-[color:var(--ii-secondary)]/50 p-5 text-center"
          >
            <p className="text-lg font-medium text-[color:var(--ii-primary)]">{schedule.title}</p>
            <p className="mt-1 text-sm text-[color:var(--ii-text)]">
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
                <p className="font-medium text-[color:var(--ii-primary)]">{schedule.venue.name}</p>
                <p className="text-[color:var(--ii-text)] opacity-80">{schedule.venue.address}</p>
                {schedule.venue.mapUrl && (
                  <a
                    href={schedule.venue.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[color:var(--ii-accent)] underline underline-offset-4"
                  >
                    Buka Peta
                  </a>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
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
    <section aria-labelledby="love-story-heading" className="mx-auto max-w-xs px-6 py-14">
      <h2 id="love-story-heading" className="sr-only">
        {loveStory.title ?? defaultTitle}
      </h2>
      <SectionLabel>{loveStory.title ?? defaultTitle}</SectionLabel>
      <ol className="mt-6 flex flex-col gap-6">
        {loveStory.items.map((item) => (
          <li key={item.id} className="text-center">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="mx-auto mb-3 h-36 w-36 rounded-2xl object-cover"
              />
            )}
            {item.dateLabel && (
              <p className="text-xs tracking-wide text-[color:var(--ii-accent)] uppercase">
                {item.dateLabel}
              </p>
            )}
            <p className="mt-1 text-lg font-medium text-[color:var(--ii-primary)]">{item.title}</p>
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
    <section aria-labelledby="gallery-heading" className="mx-auto max-w-xs px-6 py-14">
      <h2 id="gallery-heading" className="sr-only">
        Galeri
      </h2>
      <SectionLabel>Galeri</SectionLabel>
      {nonEmpty.map((gallery, index) => (
        <div key={index} className="mt-6 overflow-hidden rounded-3xl">
          {gallery.title && (
            <p className="mb-3 text-center font-medium text-[color:var(--ii-primary)]">
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
    <section aria-labelledby="rsvp-heading" className="mx-auto max-w-xs px-6 py-14">
      <h2 id="rsvp-heading" className="sr-only">
        RSVP
      </h2>
      <SectionLabel>Konfirmasi Kehadiran</SectionLabel>
      <div className="mt-6">
        <RsvpSection eventId={eventId} rsvp={rsvp} />
      </div>
    </section>
  );
}

function Gift({ giftMethods }: { giftMethods: PublicGiftMethod[] }) {
  if (giftMethods.length === 0) return null;

  return (
    <section aria-labelledby="gift-heading" className="mx-auto max-w-xs px-6 py-14">
      <h2 id="gift-heading" className="sr-only">
        Kirim Hadiah
      </h2>
      <SectionLabel>Kirim Hadiah</SectionLabel>
      <div className="mt-6 flex flex-col gap-4 text-[color:var(--ii-text)]">
        {giftMethods.map((method) => (
          <div
            key={method.id}
            className="rounded-3xl bg-[color:var(--ii-secondary)]/50 p-5 text-center text-sm"
          >
            <p className="text-xs tracking-wide text-[color:var(--ii-accent)] uppercase">
              {GIFT_METHOD_TYPE_LABELS[method.type]}
            </p>
            <p className="mt-1 text-lg font-medium text-[color:var(--ii-primary)]">
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
    <section aria-labelledby="wishes-heading" className="mx-auto max-w-xs px-6 py-14">
      <h2 id="wishes-heading" className="sr-only">
        Ucapan &amp; Doa
      </h2>
      <SectionLabel>Ucapan &amp; Doa</SectionLabel>
      <div className="mt-6 space-y-6 text-[color:var(--ii-text)]">
        {guest ? (
          <WishForm eventId={eventId} token={guest.token} guestName={guest.guestName} />
        ) : (
          <p className="rounded-3xl bg-[color:var(--ii-secondary)]/50 p-5 text-center text-sm opacity-80">
            Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda.
          </p>
        )}
        {wishes.length > 0 && (
          <ul className="space-y-3">
            {wishes.map((wish) => (
              <li
                key={wish.id}
                className="rounded-3xl bg-[color:var(--ii-secondary)]/50 p-4 text-center text-sm"
              >
                <p className="whitespace-pre-wrap">{wish.message}</p>
                <p className="mt-2 text-xs tracking-wide opacity-70">
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
    <section aria-label="Penutup" className="relative overflow-hidden px-6 py-16 text-center">
      <SoftShape className="pointer-events-none absolute -bottom-8 left-1/2 h-32 w-32 -translate-x-1/2" />
      <p className="relative mx-auto max-w-xs text-sm text-balance text-[color:var(--ii-text)] opacity-80">
        {copy.closingMessage}
      </p>
      <p className="relative mt-5 text-sm font-medium text-[color:var(--ii-primary)]">
        {copy.closingThanks}
      </p>
    </section>
  );
}

export function SoftRomanticTemplate({ invitation, rsvp, wishGuest }: InvitationTemplateProps) {
  const { sections } = invitation;
  const copy = getInvitationCopy(invitation.type);

  return (
    <main
      style={themeToCssVars(invitation.theme)}
      className="min-h-screen bg-[color:var(--ii-background)]"
    >
      <div style={{ fontFamily: "var(--ii-body-font)" }}>
        <Hero invitation={invitation} />
        {sections.identity && invitation.identity && <Identity identity={invitation.identity} />}
        {sections.schedule && <Schedule schedules={invitation.schedules} />}
        <LoveStory loveStory={invitation.loveStory} defaultTitle={copy.storyDefaultTitle} />
        <Gallery galleries={invitation.galleries} />
        {sections.rsvp && <Rsvp eventId={invitation.eventId} rsvp={rsvp ?? null} />}
        <Gift giftMethods={invitation.giftMethods} />
        {sections.wishes && (
          <Wishes
            eventId={invitation.eventId}
            wishes={invitation.wishes}
            guest={wishGuest ?? null}
          />
        )}
        <Closing copy={copy} />
      </div>
    </main>
  );
}
