import "server-only";

import { headingFontSizeFor, type OgCard } from "@/lib/invitations/og-card";

const MAX_PHOTO_BYTES = 4_000_000;
const FETCH_TIMEOUT_MS = 4_000;
/** Satori reliably decodes these two; anything else (WebP, GIF, SVG, HTML) is skipped, not risked. */
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png"]);

/**
 * Fetches the cover photo ahead of rendering and inlines it as a data URL.
 * Letting the renderer fetch it lazily would turn any slow or broken image
 * into a failed response, and crawlers would then get no preview at all.
 * Redirects are refused (the URL was already restricted to our own storage;
 * following a redirect would undo that), and size and time are capped.
 * Returns `null` on any problem — the card simply renders without a photo.
 */
export async function loadOgPhotoDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok) return null;

    const type = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!SUPPORTED_TYPES.has(type)) return null;

    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_PHOTO_BYTES) return null;

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_PHOTO_BYTES) return null;

    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Swaps the card's trusted photo URL for the inlined image, and re-fits the heading if the photo could not be loaded. */
export async function withLoadedPhoto(card: OgCard): Promise<OgCard> {
  if (!card.photoUrl) return card;

  const photoUrl = await loadOgPhotoDataUrl(card.photoUrl);
  return {
    ...card,
    photoUrl,
    headingFontSize: headingFontSizeFor(card.heading, photoUrl !== null),
  };
}
