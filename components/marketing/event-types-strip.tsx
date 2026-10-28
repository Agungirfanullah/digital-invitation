import { EVENT_TYPE_LABELS } from "@/lib/events/labels";

const LABELS = Object.values(EVENT_TYPE_LABELS).filter((label) => label !== "Lainnya");
// Each half of the track repeats the list so it stays wider than very wide screens.
const HALF = [...LABELS, ...LABELS];

/**
 * The event types the product supports (docs/PRD.md §11), as a slowly
 * moving strip under the Hero. The labels come from `lib/events/labels.ts`,
 * so the strip never advertises a type the product does not have. The
 * track holds the list twice for a seamless loop; the copy is hidden from
 * assistive technology, and reduced motion stops the movement.
 */
export function EventTypesStrip() {
  return (
    <section aria-labelledby="event-types-heading" className="border-border/60 border-y py-7">
      <h2
        id="event-types-heading"
        className="text-muted-foreground mb-5 px-5 text-center text-xs font-semibold tracking-[0.2em] uppercase"
      >
        Satu platform untuk setiap momen
      </h2>
      <div
        className="relative overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div className="animate-marquee flex w-max gap-3">
          {[false, true].map((copy) => (
            <ul key={String(copy)} aria-hidden={copy || undefined} className="flex gap-3">
              {HALF.map((label, index) => (
                <li
                  key={`${label}-${index}`}
                  aria-hidden={(!copy && index >= LABELS.length) || undefined}
                  className="border-border/70 bg-card text-foreground/80 flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium whitespace-nowrap shadow-xs"
                >
                  <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
                  Undangan {label}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
