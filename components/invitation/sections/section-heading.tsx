import type { ReactNode } from "react";

/**
 * Minimal Elegant's section heading: small tracked capitals after a short
 * hairline, aligned left like a gallery caption.
 */
export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-10 flex items-center gap-4 text-xs font-medium tracking-[0.35em] text-[color:var(--ii-accent)] uppercase"
    >
      <span aria-hidden="true" className="h-px w-10 shrink-0 bg-[color:var(--ii-accent)]" />
      {children}
    </h2>
  );
}
