"use client";

import { useState } from "react";

import type { PublicGalleryItem } from "@/lib/invitations/types";
import { GalleryLightbox } from "@/components/invitation/gallery-lightbox";

/**
 * The only interactive part of the gallery section — extracted into its
 * own Client Component so the section itself (heading, per-gallery
 * titles) stays a Server Component (CLAUDE.md §6.1: Client Components
 * only where interactivity actually requires them).
 *
 * Laid out as a mosaic in groups of three: one tall photo beside two
 * stacked ones, the tall side alternating per group. A trailing pair stays
 * in two squares and a single leftover photo spans the full width, so no
 * gaps open up.
 */
export function GalleryGrid({ items }: { items: PublicGalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-flow-row-dense grid-cols-2 gap-2">
        {items.map((item, index) => (
          <li key={item.id} className={mosaicCell(index, items.length) ?? undefined}>
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              className="group block h-full min-h-0 w-full overflow-hidden rounded-[var(--ii-radius,0.75rem)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ii-accent)] focus-visible:ring-offset-2"
            >
              {item.type === "VIDEO" ? (
                <video
                  src={item.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="aspect-square h-full w-full object-cover"
                  aria-label={item.caption ?? "Video acara"}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- our own uploaded object (or a legacy externally-hosted URL); see docs/DECISIONS.md D-042.
                <img
                  src={item.thumbnailUrl ?? item.url}
                  alt={item.caption ?? "Foto acara"}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
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

/**
 * Grid placement for one cell: the tall first cell of each complete group of
 * three, a full-width banner for a single leftover photo, otherwise a square
 * (`null`).
 */
export function mosaicCell(index: number, total: number): string | null {
  const group = Math.floor(index / 3);
  if (group * 3 + 3 <= total) {
    if (index % 3 !== 0) return null;
    return group % 2 === 0 ? "row-span-2" : "col-start-2 row-span-2";
  }
  return total % 3 === 1 && total > 1
    ? "col-span-2 [&_img]:aspect-[2/1] [&_video]:aspect-[2/1]"
    : null;
}
