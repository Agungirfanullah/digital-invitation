import { CountdownTimer } from "@/components/invitation/sections/countdown-timer";
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

  return (
    <section aria-label="Hitung mundur" className="px-6 py-16 text-center">
      <h2 className="mb-6 text-xs font-medium tracking-[0.3em] text-[color:var(--ii-accent)] uppercase">
        Hitung Mundur
      </h2>
      <p className="sr-only">
        {`Menghitung mundur menuju ${formatIndonesianDate(schedule.date)}, pukul ${formatTimeRange(
          schedule.startTime,
          schedule.startTime,
        )}.`}
      </p>
      <CountdownTimer schedule={schedule} />
    </section>
  );
}
