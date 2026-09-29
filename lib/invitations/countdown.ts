import type { InvitationSections } from "@/lib/event-types/sections";
import type { PublicSchedule } from "@/lib/invitations/types";

/**
 * Countdown MVP behavior contract (docs/PRD.md §15.2, docs/DECISIONS.md
 * D-068). Client-safe, pure functions only — no server imports — mirroring
 * `lib/event-types/identity.ts`'s `getHeroScheduleDate()` pattern, which
 * this module deliberately follows for the same reason: the public
 * projection and the editor preview must resolve identical behavior from
 * identical inputs.
 */

/**
 * The single schedule Countdown targets, or `null` if Countdown must not
 * render at all.
 *
 * Mirrors `getHeroScheduleDate()`'s guard exactly: if Schedule is
 * disabled, Countdown must not consume Schedule's data (D-064 extended to
 * Countdown by D-068) — checked first, before `schedules` is touched at
 * all, never as an afterthought.
 *
 * `schedules[0]` — the first schedule in canonical (`sortOrder`) order,
 * exactly as both `lib/invitations/projection.ts` and
 * `lib/editor/service.ts` already query it — uniformly implements the
 * entire event-type matrix with no per-type branching:
 * - Wedding, 0 schedules: `schedules[0]` is `undefined` → no target.
 * - Wedding, 1 schedule, or any non-Wedding type (always exactly 1 valid
 *   schedule per the F4 publish contract): `schedules[0]` is that
 *   schedule.
 * - Wedding, 2 schedules: `schedules[0]` is the first in canonical order
 *   (D-068's explicit rule — no "primary schedule" concept invented).
 */
export function resolveCountdownTarget(invitation: {
  schedules: PublicSchedule[];
  sections: InvitationSections;
}): PublicSchedule | null {
  if (!invitation.sections.schedule) return null;
  return invitation.schedules[0] ?? null;
}

/**
 * Combines a schedule's `date` (`YYYY-MM-DD`) and `startTime` (`HH:mm`)
 * into a `Date` instant in the **browser's local timezone** (D-068) — the
 * multi-argument `Date` constructor is used specifically because it
 * interprets its numeric fields in the runtime's local timezone, unlike
 * `new Date(isoString)` or an explicit `Z` suffix, which would force UTC.
 * This is the one function in the pipeline that deliberately introduces a
 * timezone interpretation; `EventSchedule`/`PublicSchedule` storage itself
 * remains timezone-less, exactly as `lib/invitations/format.ts` already
 * documents and D-068 explicitly preserves.
 */
export function resolveCountdownTargetDate(schedule: PublicSchedule): Date {
  const [year, month, day] = schedule.date.split("-").map(Number);
  const [hour, minute] = schedule.startTime.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export interface CountdownRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

/**
 * The remaining time between `now` and `target`, broken into
 * days/hours/minutes/seconds (D-068's exact display contract — no
 * weeks/months/years unit). Once `target` is reached or has passed, every
 * field clamps to `0` — never negative, and no separate "expired" state
 * (D-068 explicitly forbids inventing one for MVP).
 */
export function resolveCountdownRemaining(target: Date, now: Date): CountdownRemaining {
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / MS_PER_SECOND);

  return {
    days: Math.floor(totalSeconds / SECONDS_PER_DAY),
    hours: Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR),
    minutes: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: totalSeconds % SECONDS_PER_MINUTE,
  };
}
