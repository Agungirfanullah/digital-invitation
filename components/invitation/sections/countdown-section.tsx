import {
  CoverPhotoLayer,
  coverPhotoTextStyle,
} from "@/components/invitation/sections/cover-photo-background";
import { CountdownTimer } from "@/components/invitation/sections/countdown-timer";
import { templateLook } from "@/components/invitation/template-look";
import { resolveCountdownTarget } from "@/lib/invitations/countdown";
import { formatIndonesianDate, formatTimeRange } from "@/lib/invitations/format";
import type { PublicInvitation } from "@/lib/invitations/types";

/**
 * Countdown to the invitation's schedule (docs/PRD.md §15.2,
 * docs/DECISIONS.md D-068). Renders nothing when Schedule is disabled or
 * there is no schedule to target (e.g. a published Wedding with zero
 * schedules) — never a stale/fallback value, mirroring `HeroSection`'s
 * `getHeroScheduleDate()` guard for the same D-064 dependency principle.
 */
export function CountdownSection({ invitation }: { invitation: PublicInvitation }) {
  const schedule = resolveCountdownTarget(invitation);
  if (!schedule) return null;

  // Cinematic and dark templates sit the countdown on the cover photo (dark
  // scrim + light text, the same treatment as Hero). The others use a soft
  // tint of the theme, so the cover photo is not repeated mid-page.
  const onPhoto = templateLook(invitation.templateKey).countdown === "photo";
  const photoUrl = onPhoto ? invitation.theme.backgroundImageUrl : null;

  return (
    <section
      aria-label="Hitung mundur"
      className="relative isolate overflow-hidden px-6 py-16 text-center"
      style={
        coverPhotoTextStyle(photoUrl) ?? {
          background: "color-mix(in oklab, var(--ii-secondary) 22%, var(--ii-background))",
        }
      }
    >
      <CoverPhotoLayer imageUrl={photoUrl} />
      <div className="relative">
        <h2 className="mb-6 text-xs font-medium tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
          Hitung Mundur
        </h2>
        <p className="sr-only">
          {`Menghitung mundur menuju ${formatIndonesianDate(schedule.date)}, pukul ${formatTimeRange(
            schedule.startTime,
            schedule.startTime,
          )}.`}
        </p>
        <CountdownTimer schedule={schedule} onPhoto={!!photoUrl} />
        <p
          aria-hidden="true"
          className="mt-6 text-sm tracking-wide text-[color:var(--ii-text)] opacity-80"
        >
          {formatIndonesianDate(schedule.date)}
        </p>
      </div>
    </section>
  );
}
