"use client";

import { useState } from "react";

import type { PublicGalleryItem } from "@/lib/invitations/types";
import { GalleryLightbox } from "@/components/invitation/gallery-lightbox";

/**
 * The only interactive part of the gallery section — extracted into its
 * own Client Component so the section itself (heading, per-gallery
 * titles) stays a Server Component (CLAUDE.md §6.1: Client Components
 * only where interactivity actually requires them).
 */
export function GalleryGrid({ items }: { items: PublicGalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              className="block aspect-square w-full overflow-hidden rounded-md"
            >
              {item.type === "VIDEO" ? (
                <video
                  src={item.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                  aria-label={item.caption ?? "Video acara"}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- our own uploaded object (or a legacy externally-hosted URL); see docs/DECISIONS.md D-042.
                <img
                  src={item.thumbnailUrl ?? item.url}
                  alt={item.caption ?? "Foto acara"}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          </li>
        ))}
      </ul>

      {activeIndex !== null && (
        <GalleryLightbox
          items={items}
          activeIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
          onNavigate={setActiveIndex}
        />
      )}
    </>
  );
}
