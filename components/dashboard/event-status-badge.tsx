import type { EventStatus } from "@prisma/client";

import { EVENT_STATUS_LABELS } from "@/lib/events/labels";

const STATUS_CLASSES: Record<EventStatus, string> = {
  PUBLISHED: "bg-primary/15 text-primary",
  DRAFT: "bg-accent text-accent-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {EVENT_STATUS_LABELS[status]}
    </span>
  );
}
