import type { PublicLoveStory } from "@/lib/invitations/types";
import { SectionHeading } from "@/components/invitation/sections/section-heading";

/**
 * Only rendered when a LoveStory exists with at least one item.
 * `defaultTitle` is the event type's fallback heading
 * (lib/event-types/config.ts). The year sits in a narrow left column, the
 * story beside it.
 */
export function LoveStorySection({
  loveStory,
  defaultTitle,
}: {
  loveStory: PublicLoveStory | null;
  defaultTitle: string;
}) {
  if (!loveStory || loveStory.items.length === 0) return null;

  return (
    <section aria-labelledby="love-story-heading" className="px-8 py-20">
      <div className="mx-auto max-w-md">
        <SectionHeading id="love-story-heading">{loveStory.title ?? defaultTitle}</SectionHeading>

        <ol className="flex flex-col gap-10">
          {loveStory.items.map((item) => (
            <li key={item.id} className="grid grid-cols-[4.5rem_1fr] gap-4">
              <p
                className="pt-1 text-lg text-[color:var(--ii-accent)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {item.dateLabel}
              </p>
              <div className="min-w-0">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URLs; next/image would need remote-pattern config not set up for them.
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="mb-4 aspect-[4/3] w-full object-cover"
                  />
                )}
                <p
                  className="text-xl text-[color:var(--ii-primary)]"
                  style={{ fontFamily: "var(--ii-heading-font)" }}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--ii-text)] opacity-80">
                    {item.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
