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
    <section aria-labelledby={`${id}-heading`} className={`relative overflow-hidden px-6 py-20 sm:py-24 ${className ?? ""}`.trim()}>
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className={`text-center lg:text-left ${reverse ? "lg:col-span-6 lg:order-2" : "lg:col-span-6"}`}>
          <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-xl shadow-xs lg:mx-0">
            <Icon className="size-6" />
          </div>
          <h2
            id={`${id}-heading`}
            className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl text-balance"
          >
            {heading}
          </h2>
          <p className="text-muted-foreground mt-3 text-base leading-relaxed">{description}</p>
        </div>

        <div className={`flex justify-center ${reverse ? "lg:col-span-6 lg:order-1" : "lg:col-span-6"}`}>
          <div className="w-full max-w-md transition-transform duration-300 hover:scale-[1.01]">
            {visual}
          </div>
        </div>
      </div>
    </section>
  );
}
