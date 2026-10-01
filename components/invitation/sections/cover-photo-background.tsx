import type { CSSProperties } from "react";

/**
 * A Hero/cover section's full-bleed uploaded photo + dark gradient scrim
 * (`theme.backgroundImageUrl` — set via the editor's Theme form). Renders
 * nothing when there is none, so a Hero with no photo looks unchanged.
 *
 * Rendered as two `position: absolute` siblings *before* the Hero's own
 * (unchanged) children, inside a `<section className="relative ...">` —
 * never wraps the children in an extra element, so each Hero's existing
 * flex/gap layout between its heading/date/guest-name block is untouched.
 */
export function CoverPhotoLayer({ imageUrl }: { imageUrl: string | null }) {
  if (!imageUrl) return null;

  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/60"
        aria-hidden
      />
    </>
  );
}

/**
 * Re-scopes `--ii-primary`/`--ii-text`/`--ii-accent` to a fixed light
 * palette on the Hero `<section>` itself when a cover photo is present —
 * CSS custom properties cascade (the same mechanism `theme-vars.ts`
 * already relies on), so every Hero's existing
 * `text-[color:var(--ii-primary)]` etc. usages stay legible against an
 * arbitrary photo. The theme's own WCAG contrast check
 * (`lib/invitations/color-contrast.ts`) only covers flat background
 * colors, not a photo — a sufficiently dark scrim plus fixed light text is
 * the reliable alternative. Returns `undefined` (no override) when there
 * is no photo.
 */
const COVER_PHOTO_TEXT_VARS = {
  "--ii-primary": "#ffffff",
  "--ii-text": "#f5f5f4",
  "--ii-accent": "#f5f5f4",
} as CSSProperties;

export function coverPhotoTextStyle(imageUrl: string | null): CSSProperties | undefined {
  return imageUrl ? COVER_PHOTO_TEXT_VARS : undefined;
}
