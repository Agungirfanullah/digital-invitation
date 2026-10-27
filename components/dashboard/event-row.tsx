import type { EventStatus, EventType } from "@prisma/client";
import Link from "next/link";

import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { Button } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/dashboard/event-status-badge";

export function EventRow({
  event,
}: {
  event: { id: string; title: string; slug: string; type: EventType; status: EventStatus };
}) {
  return (
    <li className="group bg-card border-border/70 hover:border-primary/40 flex items-center gap-4 rounded-2xl border p-4.5 shadow-xs transition-all duration-200 hover:shadow-md">
      <div
        aria-hidden="true"
        className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-6"
        >
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="m4 7.5 8 6 8-6" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-foreground truncate text-sm font-bold sm:text-base">{event.title}</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">{EVENT_TYPE_LABELS[event.type]}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <EventStatusBadge status={event.status} />
          {event.status === "PUBLISHED" && (
            <Link
              href={`/invite/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline"
            >
              Lihat Web ↗
            </Link>
          )}
        </div>
      </div>

      <Button asChild size="sm" className="font-semibold shadow-xs">
        <Link href={`/dashboard/events/${event.id}`}>Kelola</Link>
      </Button>
    </li>
  );
}
