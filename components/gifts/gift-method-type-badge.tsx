import type { GiftMethodType } from "@prisma/client";

import { GIFT_METHOD_TYPE_LABELS } from "@/lib/gifts/labels";

export function GiftMethodTypeBadge({ type }: { type: GiftMethodType }) {
  return (
    <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
      {GIFT_METHOD_TYPE_LABELS[type]}
    </span>
  );
}
