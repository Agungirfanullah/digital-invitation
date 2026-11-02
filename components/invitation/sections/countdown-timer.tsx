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
export function CountdownTimer({
  schedule,
  onPhoto = false,
}: {
  schedule: PublicSchedule;
  /** True when the section sits on the cover photo: frosted light tiles, legible on any photo. */
  onPhoto?: boolean;
}) {
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
    <div className="mx-auto grid max-w-sm grid-cols-4 gap-2.5 sm:gap-3" aria-hidden="true">
      {UNITS.map(({ key, label }) => (
        <div
          key={key}
          className={`flex flex-col items-center justify-center rounded-[var(--ii-radius,0.75rem)] border px-1 py-4 ${
            onPhoto
              ? "border-white/30 bg-white/10 text-white backdrop-blur-md"
              : "border-[color:var(--ii-accent)]/30 bg-[color:var(--ii-background)] text-[color:var(--ii-primary)] shadow-sm"
          }`}
        >
          <span
            data-testid="countdown-value"
            className="text-3xl leading-none font-semibold tabular-nums"
            style={{ fontFamily: "var(--ii-heading-font)" }}
          >
            {remaining[key]}
          </span>
          <span className="mt-2 text-[10px] font-medium tracking-[0.2em] uppercase opacity-80">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
