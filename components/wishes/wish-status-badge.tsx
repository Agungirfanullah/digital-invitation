import type { WishStatus } from "@prisma/client";

import { WISH_STATUS_LABELS } from "@/lib/wishes/labels";

const STATUS_STYLE: Record<WishStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  HIDDEN: "bg-secondary text-secondary-foreground",
  DELETED: "bg-red-100 text-red-800",
};

export function WishStatusBadge({ status }: { status: WishStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {WISH_STATUS_LABELS[status]}
    </span>
  );
}
