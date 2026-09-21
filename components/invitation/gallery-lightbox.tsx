"use client";

import { useEffect, useId, useRef } from "react";

import type { PublicGalleryItem } from "@/lib/invitations/types";

export interface GalleryLightboxProps {
  items: PublicGalleryItem[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * An in-page modal — replaces the previous behavior of opening the raw
 * image URL in a new browser tab (`target="_blank"`). Only ever receives
 * already-safe-URL-filtered `PublicGalleryItem`s (lib/invitations/
 * projection.ts); renders no id/storage metadata beyond the `caption`
 * text the event owner themselves wrote.
 */
export function GalleryLightbox({ items, activeIndex, onClose, onNavigate }: GalleryLightboxProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const item = items[activeIndex];

  // Move focus into the dialog on open (basic focus management) and
  // restore it to whatever triggered the lightbox on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowRight" && activeIndex < items.length - 1) {
        onNavigate(activeIndex + 1);
      } else if (event.key === "ArrowLeft" && activeIndex > 0) {
        onNavigate(activeIndex - 1);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, items.length, onClose, onNavigate]);

  // Prevent the page behind the modal from scrolling while it's open —
  // restored unconditionally on unmount regardless of how the effect re-runs.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <h2 id={titleId} className="sr-only">
        {item.caption ?? (item.type === "VIDEO" ? "Video acara" : "Foto acara")}
      </h2>

      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
      >
        &times;
      </button>

      {activeIndex > 0 && (
        <button
          type="button"
          aria-label="Sebelumnya"
          onClick={(event) => {
            event.stopPropagation();
            onNavigate(activeIndex - 1);
          }}
          className="absolute left-2 flex size-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20 sm:left-4"
        >
          ‹
        </button>
      )}
      {activeIndex < items.length - 1 && (
        <button
          type="button"
          aria-label="Selanjutnya"
          onClick={(event) => {
            event.stopPropagation();
            onNavigate(activeIndex + 1);
          }}
          className="absolute right-2 flex size-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20 sm:right-4"
        >
          ›
        </button>
      )}

      <div
        className="flex max-h-[85vh] max-w-[90vw] flex-col items-center gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        {item.type === "VIDEO" ? (
          <video src={item.url} controls autoPlay className="max-h-[75vh] max-w-full rounded-md" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- our own uploaded object (or a legacy externally-hosted URL); see gallery-section.tsx.
          <img
            src={item.url}
            alt={item.caption ?? "Foto acara"}
            className="max-h-[75vh] max-w-full rounded-md object-contain"
          />
        )}
        {item.caption && <p className="text-center text-sm text-white/90">{item.caption}</p>}
      </div>
    </div>
  );
}
