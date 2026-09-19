import type { GuestCategory } from "@prisma/client";

import { GUEST_CATEGORY_LABELS } from "@/lib/guests/labels";

export function GuestCategoryBadge({ category }: { category: GuestCategory }) {
  return (
    <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
      {GUEST_CATEGORY_LABELS[category]}
    </span>
  );
}
