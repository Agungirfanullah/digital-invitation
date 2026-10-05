"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

/**
 * Lets a guest pull up their own check-in QR directly from their
 * personalized invitation page, instead of needing the file the owner can
 * separately download from the dashboard (`components/guests/guest-qr-code.tsx`).
 * Encodes `window.location.href` — the exact URL the guest is already on
 * (their personalized `?to=` link), the same value the owner's QR encodes
 * (`buildGuestInvitationUrl()`'s output) — captured lazily on click rather
 * than during render, since a Client Component's first render still runs
 * on the server, where `window` doesn't exist.
 */
export function GuestQrButton({ guestName }: { guestName: string }) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setCurrentUrl(window.location.href)}
        aria-label="Tampilkan QR check-in"
        title="QR Check-in"
        className="fixed top-4 right-4 z-40 flex size-11 items-center justify-center rounded-full border border-[color:var(--ii-secondary)] bg-[color:var(--ii-background)]/95 text-[color:var(--ii-primary)] shadow-lg backdrop-blur transition-colors hover:bg-[color:var(--ii-secondary)]/60"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="size-5"
          aria-hidden
        >
          <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
          <path d="M14.5 14.5h3v3h-3zM19.5 14.5h1v1h-1zM14.5 19.5h1v1h-1zM19.5 19.5h1v1h-1z" />
        </svg>
      </button>

      {currentUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QR check-in"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setCurrentUrl(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-6 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-sm font-medium text-gray-900">Tunjukkan QR ini saat check-in</p>
            <div className="mt-4 flex justify-center">
              <QRCodeSVG value={currentUrl} size={200} level="M" marginSize={2} />
            </div>
            <p className="mt-3 text-sm text-gray-600">{guestName}</p>
            <button
              type="button"
              onClick={() => setCurrentUrl(null)}
              className="mt-4 text-sm text-gray-500 underline underline-offset-4"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
