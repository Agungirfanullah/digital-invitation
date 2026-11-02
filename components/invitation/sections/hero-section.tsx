import { getHeroHeading, getHeroScheduleDate } from "@/lib/event-types/identity";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { formatIndonesianDate } from "@/lib/invitations/format";
import type { PublicInvitation } from "@/lib/invitations/types";
import {
  CoverPhotoLayer,
  coverPhotoTextStyle,
} from "@/components/invitation/sections/cover-photo-background";

/**
 * Minimal Elegant's cover: a white-gallery title card. The event type sits
 * top-left, the heading is set large and left-aligned low on the page, and
 * the date and guest name follow below a hairline, like a caption.
 */
export function HeroSection({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;

  return (
    <section
      aria-label="Sampul undangan"
      className="relative flex min-h-screen flex-col justify-between px-8 pt-16 pb-20"
      style={coverPhotoTextStyle(coverPhotoUrl)}
    >
      <CoverPhotoLayer imageUrl={coverPhotoUrl} />

      <p className="relative text-xs font-medium tracking-[0.4em] text-[color:var(--ii-accent)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>

      <div className="relative">
        <h1
          className="max-w-sm text-5xl leading-[1.05] font-normal text-balance text-[color:var(--ii-primary)] sm:text-6xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {getHeroHeading(invitation)}
        </h1>
        <div className="mt-8 h-px w-16 bg-[color:var(--ii-accent)]" />
        {heroDate && (
          <p className="mt-6 text-sm tracking-[0.2em] text-[color:var(--ii-text)] uppercase">
            {formatIndonesianDate(heroDate)}
          </p>
        )}

        <div className="mt-12">
          <p className="text-[11px] tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-70">
            Kepada Yth.
          </p>
          <p className="mt-1 text-lg text-[color:var(--ii-primary)]">
            {invitation.guest?.displayName ?? "Bapak/Ibu/Saudara/i Tamu Undangan"}
          </p>
        </div>
      </div>
    </section>
  );
}
