import "server-only";

import { ImageResponse } from "next/og";

import type { OgCard } from "@/lib/invitations/og-card";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

/**
 * Kept small on purpose: photographic content does not compress as PNG, and
 * WhatsApp (the main way these links are shared) tends to drop previews whose
 * image is much over ~300 KB. A text-only card is ~40 KB; this arch keeps the
 * photo variant under that ceiling.
 */
const PHOTO_WIDTH = 260;
const PHOTO_HEIGHT = 420;

/** A short CDN cache: crawlers re-fetch often and rendering costs CPU, but an unpublished event must stop showing up quickly. */
const CACHEABLE = "public, s-maxage=300";

/**
 * Renders the shared link-preview card. Satori (behind `ImageResponse`)
 * needs `display: flex` on every element with more than one child.
 */
export function createOgImageResponse(card: OgCard, options: { cacheable: boolean }) {
  const { colors } = card;
  const hasPhoto = card.photoUrl !== null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: 40,
        background: colors.background,
        color: colors.text,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "44px 56px",
          border: `3px solid ${colors.accent}`,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: colors.accent,
          }}
        >
          {card.typeLabel}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: card.headingFontSize,
              fontWeight: 700,
              lineHeight: 1.1,
              color: colors.primary,
            }}
          >
            {card.heading}
          </div>
          {card.dateLabel && (
            <div style={{ display: "flex", marginTop: 24, fontSize: 36 }}>{card.dateLabel}</div>
          )}
        </div>

        <div style={{ display: "flex", fontSize: 24, opacity: 0.7 }}>{card.footer}</div>
      </div>

      {hasPhoto && card.photoUrl && (
        <div
          style={{
            display: "flex",
            width: PHOTO_WIDTH,
            height: PHOTO_HEIGHT,
            alignSelf: "center",
            marginLeft: 32,
            borderRadius: `${PHOTO_WIDTH / 2}px ${PHOTO_WIDTH / 2}px 0 0`,
            overflow: "hidden",
            border: `3px solid ${colors.accent}`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser. */}
          <img
            src={card.photoUrl}
            alt=""
            width={PHOTO_WIDTH - 6}
            height={PHOTO_HEIGHT - 6}
            style={{ objectFit: "cover" }}
          />
        </div>
      )}
    </div>,
    {
      ...OG_IMAGE_SIZE,
      headers: { "Cache-Control": options.cacheable ? CACHEABLE : "no-store" },
    },
  );
}
