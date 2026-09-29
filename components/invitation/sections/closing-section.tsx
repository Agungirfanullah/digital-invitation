import type { EventType } from "@prisma/client";

import { getInvitationCopy } from "@/lib/event-types/config";

export function ClosingSection({ type }: { type: EventType }) {
  const copy = getInvitationCopy(type);

  return (
    <section aria-label="Penutup" className="px-6 py-16 text-center">
      <p className="mx-auto max-w-sm text-sm text-balance text-[color:var(--ii-text)] opacity-80">
        {copy.closingMessage}
      </p>
      <p className="mt-6 text-sm font-medium text-[color:var(--ii-primary)]">
        {copy.closingThanks}
      </p>
    </section>
  );
}
