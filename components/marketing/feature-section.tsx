import type { ComponentType, ReactNode } from "react";

/**
 * A single-message marketing section — shared shape for the Homepage's
 * Guest Management / RSVP / Digital Gift / Analytics sections
 * (docs/PRD.md §8 items 6-9, D-073). Each describes an already-shipped
 * capability; none of these sections implement the feature itself.
 *
 * `visual` is a small, honest illustration of the real feature (real
 * status labels/terminology from the product, e.g. `lib/rsvp/labels.ts`'s
 * "Hadir"/"Tidak Hadir"/"Belum Pasti" — never an invented statistic or a
 * literal screenshot claiming to be real usage data). `reverse` alternates
 * which side the text sits on, so these four sections don't all read as
 * the same centered block in a row.
 */
export function FeatureSection({
  id,
  heading,
  description,
  icon: Icon,
  visual,
  reverse = false,
  className,
}: {
  id: string;
  heading: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  visual: ReactNode;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className={`px-6 py-16 ${className ?? ""}`.trim()}>
      <div className="mx-auto grid max-w-4xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={`text-center lg:text-left ${reverse ? "lg:order-2" : ""}`}>
          <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full lg:mx-0">
            <Icon className="size-6" />
          </div>
          <h2
            id={`${id}-heading`}
            className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {heading}
          </h2>
          <p className="text-muted-foreground mt-3">{description}</p>
        </div>

        <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
      </div>
    </section>
  );
}
