import type { EventType } from "@prisma/client";

import { getInvitationCopy } from "@/lib/event-types/config";

/** Minimal Elegant's closing: the message set large and left-aligned, thanks below a hairline. */
export function ClosingSection({ type }: { type: EventType }) {
  const copy = getInvitationCopy(type);

  return (
    <section aria-label="Penutup" className="px-8 pt-16 pb-28">
      <div className="mx-auto max-w-md">
        <p
          className="text-2xl leading-snug text-balance text-[color:var(--ii-primary)]"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {copy.closingMessage}
        </p>
        <div className="mt-8 h-px w-16 bg-[color:var(--ii-accent)]" />
        <p className="mt-6 text-xs tracking-[0.3em] text-[color:var(--ii-text)] uppercase opacity-80">
          {copy.closingThanks}
        </p>
      </div>
    </section>
  );
}
