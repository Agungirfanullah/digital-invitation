import type { EventStatus, EventType } from "@prisma/client";
import Link from "next/link";

import type { EventStats } from "@/lib/events/service";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { Button } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/dashboard/event-status-badge";

const STAT_LABELS: { key: keyof EventStats; label: string }[] = [
  { key: "guests", label: "Tamu" },
  { key: "attendingPeople", label: "Akan hadir" },
  { key: "wishes", label: "Ucapan" },
];

/** One event as a card in the dashboard's lists; its numbers come from `listEventsWithStatsForUser()`. */
export function EventRow({
  event,
}: {
  event: {
    id: string;
    title: string;
    slug: string;
    type: EventType;
    status: EventStatus;
    stats?: EventStats;
  };
}) {
  return (
    <li className="group border-border/60 bg-card hover:border-primary/30 flex flex-col rounded-2xl border p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="from-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br to-emerald-400/15 text-base font-bold"
        >
          {event.title.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {EVENT_TYPE_LABELS[event.type]}
            </span>
            <EventStatusBadge status={event.status} />
          </div>
          <h3 className="text-foreground mt-1 truncate text-base font-bold tracking-tight">
            {event.title}
          </h3>
        </div>
      </div>

      {event.stats && (
        <dl className="bg-muted/50 mt-4 grid grid-cols-3 gap-2 rounded-xl px-3 py-2.5">
          {STAT_LABELS.map((stat) => (
            <div key={stat.key}>
              <dt className="text-muted-foreground text-[11px] font-medium">{stat.label}</dt>
              <dd className="text-foreground text-base font-bold tabular-nums">
                {event.stats?.[stat.key]}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        {event.status === "PUBLISHED" ? (
          <Link
            href={`/invite/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
          >
            Lihat Web ↗
          </Link>
        ) : (
          <span />
        )}
        <Button asChild size="sm" className="rounded-full px-4 font-semibold">
          <Link href={`/dashboard/events/${event.id}`}>Kelola</Link>
        </Button>
      </div>
    </li>
  );
}
