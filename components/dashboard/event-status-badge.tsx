import type { EventStatus } from "@prisma/client";

import { EVENT_STATUS_LABELS } from "@/lib/events/labels";

const STATUS_CLASSES: Record<EventStatus, string> = {
  PUBLISHED: "bg-emerald-500/10 text-emerald-700",
  DRAFT: "bg-amber-500/10 text-amber-700",
  ARCHIVED: "bg-muted text-muted-foreground",
};

const DOT_CLASSES: Record<EventStatus, string> = {
  PUBLISHED: "bg-emerald-500",
  DRAFT: "bg-amber-500",
  ARCHIVED: "bg-muted-foreground/60",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${DOT_CLASSES[status]}`} />
      {EVENT_STATUS_LABELS[status]}
    </span>
  );
}
