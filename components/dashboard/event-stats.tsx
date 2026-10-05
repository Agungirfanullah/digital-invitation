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
    <dl className="grid grid-cols-3 gap-2">
      {TILES.map((tile) => (
        <div
          key={tile.key}
          className={`rounded-lg px-3 py-2 text-center ${
            variant === "onBand" ? "bg-card text-foreground" : "bg-secondary/60"
          }`}
        >
          <dd className="text-lg font-semibold tabular-nums">{stats[tile.key]}</dd>
          <dt className="text-muted-foreground text-xs">{tile.label}</dt>
        </div>
      ))}
    </dl>
  );
}
