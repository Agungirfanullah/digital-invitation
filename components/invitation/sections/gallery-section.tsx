import type { PublicGallery } from "@/lib/invitations/types";
import { GalleryGrid } from "@/components/invitation/sections/gallery-grid";

/**
 * Server Component — only the grid/lightbox interaction
 * (`components/invitation/sections/gallery-grid.tsx`) is a Client
 * Component. Only rendered when at least one gallery has at least one
 * item; never a placeholder/empty section (CLAUDE.md §1.5/§9.1).
 */
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
          <GalleryGrid items={gallery.items} />
        </div>
      ))}
    </section>
  );
}
