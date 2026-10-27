import type { EventStats } from "@/lib/events/service";

const TILES: { key: keyof EventStats; label: string }[] = [
  { key: "guests", label: "Tamu" },
  { key: "attendingPeople", label: "Akan Hadir" },
  { key: "wishes", label: "Ucapan" },
];

export function EventStatsRow({
  stats,
  variant = "light",
}: {
  stats: EventStats;
  /** `onBand` renders white tiles for use on top of a solid primary-colored header. */
  variant?: "light" | "onBand";
}) {
  return (
    <dl className="grid grid-cols-3 gap-2.5">
      {TILES.map((tile) => (
        <div
          key={tile.key}
          className={`rounded-xl px-3 py-2.5 text-center transition-all ${
            variant === "onBand"
              ? "bg-card/95 text-foreground shadow-xs ring-1 ring-black/5"
              : "bg-secondary/70 border-border/50 border"
          }`}
        >
          <dd className="text-foreground text-xl font-bold tracking-tight tabular-nums">
            {stats[tile.key]}
          </dd>
          <dt className="text-muted-foreground mt-0.5 text-[11px] font-medium tracking-wider uppercase">
            {tile.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
