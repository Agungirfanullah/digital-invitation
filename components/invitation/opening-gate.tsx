"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { themeToCssVars } from "@/components/invitation/theme-vars";
import { getHeroHeading, getHeroScheduleDate } from "@/lib/event-types/identity";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { formatIndonesianDate } from "@/lib/invitations/format";
import type { PublicInvitation } from "@/lib/invitations/types";

/**
 * Opening/Reveal gate (docs/PRD.md §17, docs/DECISIONS.md D-069) — a
 * structural, guest-facing gate rendered above the invitation content by
 * `InvitationRenderer`, not a member of `INVITATION_SECTION_KEYS`/
 * `sectionOrder`. One shared implementation for all six templates; the
 * template itself is `children` here and is never modified.
 *
 * Content reuses `getHeroHeading()`/`getHeroScheduleDate()` (the exact
 * functions Hero already uses) rather than re-deriving the same
 * Identity/Schedule-dependency guard — Opening does not depend on Hero
 * itself (`sections.hero` is never read here), it independently shares
 * the same underlying identity/schedule resolution Hero also uses.
 *
 * State is ephemeral client React state only (D-069-04): no cookie, no
 * localStorage, no URL parameter, no server write. A full page refresh
 * always starts unrevealed again, by construction.
 *
 * Accessibility follows the same pattern already established by
 * `GalleryLightbox` (the only existing modal-like component in this
 * codebase): `role="dialog"`, `aria-modal`, focus moved to the gate on
 * mount, body scroll locked while the gate is up. The content behind the
 * gate is hidden via `visibility: hidden` (not just `opacity`), which
 * also removes it from the accessibility tree and the tab order until
 * revealed — no separate `aria-hidden`/`inert` bookkeeping needed.
 */
export function OpeningGate({
  invitation,
  children,
}: {
  invitation: PublicInvitation;
  children: ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);
  const headingId = useId();
  const ctaRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus the CTA once, when the gate first mounts (it is only ever
  // mounted "closed" — see the early return below).
  useEffect(() => {
    ctaRef.current?.focus();
  }, []);

  // Lock page scroll while the gate is up; always restored, regardless of
  // how the effect re-runs or unmounts (same pattern as GalleryLightbox).
  // Must also no-op when Opening is disabled (D-069-FIX): this effect runs
  // unconditionally on every mount (Rules of Hooks — it can't move below
  // the early return just below), so without this guard it would lock
  // scroll even though no gate is ever shown, with no CTA in that render
  // path to ever flip `revealed` and release it — a permanent scroll lock.
  useEffect(() => {
    if (!invitation.openingEnabled || revealed) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [invitation.openingEnabled, revealed]);

  if (!invitation.openingEnabled) return <>{children}</>;

  const heading = getHeroHeading(invitation);
  const scheduleDate = getHeroScheduleDate(invitation);
  const guestName = invitation.guest?.displayName ?? null;

  function handleReveal() {
    setRevealed(true);
    // The CTA that had focus is about to become inert; move focus to the
    // now-visible content instead of silently dropping it to <body>.
    contentRef.current?.focus();
  }

  return (
    <div style={themeToCssVars(invitation.theme)}>
      <div
        ref={contentRef}
        tabIndex={-1}
        style={{ visibility: revealed ? "visible" : "hidden" }}
        className="outline-none"
      >
        {children}
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-hidden={revealed}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[color:var(--ii-background)] p-6 text-center transition-opacity duration-500 motion-reduce:transition-none motion-reduce:duration-0 lg:left-auto lg:w-[var(--invite-column)] ${
          revealed ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        {/* Luxury Envelope Card Container */}
        <div className="relative flex w-full max-w-sm flex-col items-center justify-center rounded-3xl border border-[color:var(--ii-accent)]/40 bg-[color:var(--ii-background)] p-8 shadow-2xl ring-1 ring-[color:var(--ii-accent)]/20">
          {/* Subtle corner flourish decorative SVG */}
          <svg
            viewBox="0 0 40 40"
            className="absolute top-3 left-3 size-6 text-[color:var(--ii-accent)] opacity-60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M4 28V4h24" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          </svg>
          <svg
            viewBox="0 0 40 40"
            className="absolute top-3 right-3 size-6 -scale-x-100 text-[color:var(--ii-accent)] opacity-60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M4 28V4h24" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          </svg>
          <svg
            viewBox="0 0 40 40"
            className="absolute bottom-3 left-3 size-6 -scale-y-100 text-[color:var(--ii-accent)] opacity-60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M4 28V4h24" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          </svg>
          <svg
            viewBox="0 0 40 40"
            className="absolute bottom-3 right-3 size-6 -scale-100 text-[color:var(--ii-accent)] opacity-60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M4 28V4h24" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          </svg>

          {/* Event type badge */}
          <p className="text-xs font-semibold tracking-[0.35em] text-[color:var(--ii-accent)] uppercase">
            {EVENT_TYPE_LABELS[invitation.type]}
          </p>

          <h1
            id={headingId}
            className="mt-4 text-3xl sm:text-4xl font-bold text-balance text-[color:var(--ii-primary)] tracking-tight leading-snug"
            style={{ fontFamily: "var(--ii-heading-font)" }}
          >
            {heading}
          </h1>

          {scheduleDate && (
            <p className="mt-3 text-sm font-medium text-[color:var(--ii-text)] opacity-90 tracking-wide">
              {formatIndonesianDate(scheduleDate)}
            </p>
          )}

          {guestName && (
            <div className="my-5 w-full rounded-2xl border border-[color:var(--ii-accent)]/30 bg-[color:var(--ii-secondary)]/30 px-5 py-3 shadow-xs">
              <p className="text-sm text-[color:var(--ii-text)]">
                <span className="text-xs uppercase tracking-widest text-[color:var(--ii-accent)] font-semibold">Dear</span>
                <br />
                <span className="font-bold text-base text-[color:var(--ii-primary)]">{guestName}</span>
              </p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleReveal}
            ref={ctaRef}
            className="mt-5 h-11 px-7 font-semibold shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            Buka Undangan
          </Button>
        </div>
      </div>
    </div>
  );
}
