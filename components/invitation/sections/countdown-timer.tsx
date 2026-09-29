"use client";

import { useEffect, useMemo, useState } from "react";

import {
  resolveCountdownRemaining,
  resolveCountdownTargetDate,
  type CountdownRemaining,
} from "@/lib/invitations/countdown";
import type { PublicSchedule } from "@/lib/invitations/types";

const UNITS: { key: keyof CountdownRemaining; label: string }[] = [
  { key: "days", label: "Hari" },
  { key: "hours", label: "Jam" },
  { key: "minutes", label: "Menit" },
  { key: "seconds", label: "Detik" },
];

/**
 * The live-ticking part of Countdown (docs/PRD.md §15.2, docs/DECISIONS.md
 * D-068) — split into its own client component so the surrounding
 * `CountdownSection` stays a server component, matching this codebase's
 * existing pattern of pushing `"use client"` down to only the interactive
 * piece (see `WishesSection`/`WishForm`).
 *
 * Renders nothing until the first client-side tick: the target instant is
 * deliberately interpreted in the guest's browser-local timezone (D-068),
 * which the server cannot know in advance, so any server-rendered initial
 * value would be wrong or mismatched at hydration. This is a mechanical
 * necessity of the browser-local timezone contract, not a "hidden until
 * ready" product state and not the "event started" state D-068 forbids.
 *
 * The ticking numbers are `aria-hidden` — `CountdownSection` already
 * states the target date/time once, as static text, for screen readers.
 * A region whose text changes every second would otherwise force an
 * `aria-live` announcement every second, which is disruptive rather than
 * helpful (D-068 doesn't mandate a specific accessibility strategy; this
 * is the smallest choice consistent with not spamming assistive tech).
 */
export function CountdownTimer({ schedule }: { schedule: PublicSchedule }) {
  const target = useMemo(() => resolveCountdownTargetDate(schedule), [schedule]);
  const [remaining, setRemaining] = useState<CountdownRemaining | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(resolveCountdownRemaining(target, new Date()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!remaining) return null;

  return (
    <div className="mx-auto grid max-w-sm grid-cols-4 gap-3" aria-hidden="true">
      {UNITS.map(({ key, label }) => (
        <div
          key={key}
          className="rounded-lg border border-[color:var(--ii-secondary)] px-2 py-3 text-center"
        >
          <p className="text-2xl font-semibold text-[color:var(--ii-primary)] tabular-nums">
            {remaining[key]}
          </p>
          <p className="mt-1 text-[10px] tracking-wide text-[color:var(--ii-text)] uppercase opacity-70">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
