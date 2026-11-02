import type { PublicGallery } from "@/lib/invitations/types";
import { GalleryGrid } from "@/components/invitation/sections/gallery-grid";
import { SectionHeading } from "@/components/invitation/sections/section-heading";

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
    <section aria-labelledby="gallery-heading" className="px-8 py-20">
      <div className="mx-auto max-w-md">
        <SectionHeading id="gallery-heading">Galeri</SectionHeading>

        {nonEmptyGalleries.map((gallery, galleryIndex) => (
          <div key={galleryIndex} className="mb-10 last:mb-0">
            {gallery.title && (
              <p className="mb-3 text-sm text-[color:var(--ii-primary)]">{gallery.title}</p>
            )}
            <GalleryGrid items={gallery.items} />
          </div>
        ))}
      </div>
    </section>
  );
}
