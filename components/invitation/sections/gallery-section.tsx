import type { PublicGallery } from "@/lib/invitations/types";

/** Only rendered when at least one gallery has at least one item. */
export function GallerySection({ galleries }: { galleries: PublicGallery[] }) {
  const nonEmptyGalleries = galleries.filter((gallery) => gallery.items.length > 0);
  if (nonEmptyGalleries.length === 0) return null;

  return (
    <section aria-labelledby="gallery-heading" className="px-6 py-16">
      <h2
        id="gallery-heading"
        className="mb-8 text-center text-xs font-medium tracking-[0.3em] text-[color:var(--ii-accent)] uppercase"
      >
        Galeri
      </h2>

      {nonEmptyGalleries.map((gallery, galleryIndex) => (
        <div key={galleryIndex} className="mx-auto mb-8 max-w-2xl last:mb-0">
          {gallery.title && (
            <p className="mb-3 text-center font-medium text-[color:var(--ii-primary)]">
              {gallery.title}
            </p>
          )}
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gallery.items.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-square overflow-hidden rounded-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URLs; see love-story-section.tsx. */}
                  <img
                    src={item.thumbnailUrl ?? item.url}
                    alt={item.caption ?? (item.type === "VIDEO" ? "Video acara" : "Foto acara")}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
