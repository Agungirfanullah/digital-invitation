import type { ReactNode } from "react";

/**
 * Shared iPhone-style mockup chrome around a rendered invitation preview —
 * used by the Homepage's Hero, Template Showcase, and Invitation Preview sections
 * and by the editor's template gallery.
 * Pure CSS (no image asset): rounded chassis and a Dynamic Island
 * overlapping the top of the screen content.
 *
 * `compact` (the Template Showcase grid, where the frame is much smaller)
 * drops the side buttons and uses a thinner border/corner radius — the
 * default chassis proportions (tuned for the larger Hero/Invitation
 * Preview sizes) look heavy and asymmetric shrunk down that far.
 *
 * `children` is rendered at a fixed real mobile width (390px, the same
 * templates are actually designed for) and scaled down to whatever width
 * this frame ends up at via a CSS container query (`cqw`) — a pure-CSS
 * equivalent of `width-this-frame-actually-is / 390`, computed by the
 * browser, not hardcoded per call site. Without this, cramming a
 * 390px-wide design into a 220px card would make its real (unscaled) text
 * sizes look oversized relative to the shrunk chassis around it.
 */
export function PhoneFrame({
  children,
  heightClassName = "h-[650px]",
  compact = false,
}: {
  children: ReactNode;
  heightClassName?: string;
  compact?: boolean;
}) {
  const borderClass = compact ? "border-[6px]" : "border-[12px]";
  const chassisRadiusClass = compact ? "rounded-[1.75rem]" : "rounded-[3rem]";
  const screenRadiusClass = compact ? "rounded-[1.3rem]" : "rounded-[2.1rem]";
  const islandClass = compact ? "top-1.5 h-3.5 w-14" : "top-2.5 h-6 w-28";

  return (
    <div className="relative mx-auto w-full">
      {!compact && (
        <>
          {/* Side buttons — omitted at `compact` size, where they'd just add visual clutter/asymmetry. */}
          <span
            className="absolute top-[80px] -left-[3px] h-7 w-[3px] rounded-l-sm bg-black"
            aria-hidden
          />
          <span
            className="absolute top-[128px] -left-[3px] h-11 w-[3px] rounded-l-sm bg-black"
            aria-hidden
          />
          <span
            className="absolute top-[184px] -left-[3px] h-11 w-[3px] rounded-l-sm bg-black"
            aria-hidden
          />
          <span
            className="absolute top-[144px] -right-[3px] h-14 w-[3px] rounded-r-sm bg-black"
            aria-hidden
          />
        </>
      )}

      <div
        className={`relative ${chassisRadiusClass} ${borderClass} border-black bg-black shadow-xl`}
      >
        {/* Positioned against this static chassis (never scrolls), not the
            screen content below — so it stays exactly centered regardless
            of whether that content's scrollbar is visible. */}
        <div
          className={`absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-black ${islandClass}`}
          aria-hidden
        />
        <div
          className={`no-scrollbar relative overflow-hidden overflow-y-auto ${screenRadiusClass} bg-white ${heightClassName}`}
          style={{ containerType: "inline-size" }}
        >
          <div
            style={{
              width: "390px",
              transform: "scale(calc(100cqw / 390px))",
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
