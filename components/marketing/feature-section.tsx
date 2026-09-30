/**
 * A single-message marketing section — shared shape for the Homepage's
 * Guest Management / RSVP / Digital Gift / Analytics sections
 * (docs/PRD.md §8 items 6-9, D-073). Each describes an already-shipped
 * capability; none of these sections implement the feature itself.
 */
export function FeatureSection({
  id,
  heading,
  description,
  className,
}: {
  id: string;
  heading: string;
  description: string;
  className?: string;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className={`px-6 py-14 ${className ?? ""}`.trim()}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 id={`${id}-heading`} className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {heading}
        </h2>
        <p className="text-muted-foreground mt-3">{description}</p>
      </div>
    </section>
  );
}
