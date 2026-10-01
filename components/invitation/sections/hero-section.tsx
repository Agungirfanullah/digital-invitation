import { getHeroHeading, getHeroScheduleDate } from "@/lib/event-types/identity";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { formatIndonesianDate } from "@/lib/invitations/format";
import type { PublicInvitation } from "@/lib/invitations/types";
import {
  CoverPhotoLayer,
  coverPhotoTextStyle,
} from "@/components/invitation/sections/cover-photo-background";

export function HeroSection({ invitation }: { invitation: PublicInvitation }) {
  const heroDate = getHeroScheduleDate(invitation);
  const coverPhotoUrl = invitation.theme.backgroundImageUrl;

  return (
    <section
      aria-label="Sampul undangan"
      className="relative flex min-h-[80vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      style={coverPhotoTextStyle(coverPhotoUrl)}
    >
      <CoverPhotoLayer imageUrl={coverPhotoUrl} />

      <p className="relative text-xs font-medium tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
        {EVENT_TYPE_LABELS[invitation.type]}
      </p>

      <h1
        className="relative text-4xl font-semibold text-balance text-[color:var(--ii-primary)] sm:text-5xl"
        style={{ fontFamily: "var(--ii-heading-font)" }}
      >
        {getHeroHeading(invitation)}
      </h1>

      {heroDate && (
        <p className="relative text-sm text-[color:var(--ii-text)]">
          {formatIndonesianDate(heroDate)}
        </p>
      )}

      <div className="relative mt-6 space-y-1">
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
