import { getHeroHeading, getHeroScheduleDate } from "@/lib/event-types/identity";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { formatIndonesianDate } from "@/lib/invitations/format";
import type { PublicInvitation } from "@/lib/invitations/types";

export interface OgCard {
  typeLabel: string;
  heading: string;
  headingFontSize: number;
  dateLabel: string | null;
  /** Only ever a URL that `isTrustedPhotoUrl` accepted, never owner-supplied text as-is. */
  photoUrl: string | null;
  footer: string;
  colors: { background: string; text: string; primary: string; accent: string };
}

export const OG_BRAND_COLORS: OgCard["colors"] = {
  background: "#fbf7ec",
  text: "#1c2b24",
  primary: "#0b6b4f",
  accent: "#0b6b4f",
};

export const GENERIC_OG_CARD: OgCard = {
  typeLabel: "Undangan Digital",
  heading: "Buka undangan digital ini",
  headingFontSize: 72,
  dateLabel: null,
  photoUrl: null,
  footer: "Digital Invitation",
  colors: OG_BRAND_COLORS,
};

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Theme colors are owner-controlled free text. The image renderer only gets
 * plain hex values; anything else (a CSS function, a variable, garbage)
 * falls back to the brand color instead of reaching the renderer.
 */
export function safeColor(value: string | null | undefined, fallback: string): string {
  return value && HEX_COLOR.test(value.trim()) ? value.trim() : fallback;
}

export function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/** Shrinks long headings so they stay inside the card; a photo narrows the text column, so it shrinks a bit more. */
export function headingFontSizeFor(heading: string, hasPhoto: boolean): number {
  const length = heading.length;
  const base = length <= 14 ? 112 : length <= 24 ? 92 : length <= 40 ? 72 : 56;
  return hasPhoto ? Math.round(base * 0.82) : base;
}

const MAX_HEADING_LENGTH = 90;

/**
 * Builds the link-preview card from an already-public invitation. Uses the
 * same hero heading/date rules as the page itself (docs/DECISIONS.md D-064):
 * a section the owner disabled contributes nothing. Never takes a guest
 * token or guest name — link previews are fetched by crawlers and cached, so
 * they must be identical for everyone.
 */
export function buildOgCard(
  invitation: PublicInvitation,
  options: { isTrustedPhotoUrl: (url: string) => boolean; footer?: string },
): OgCard {
  const heading = truncate(getHeroHeading(invitation), MAX_HEADING_LENGTH);
  const heroDate = getHeroScheduleDate(invitation);
  const coverUrl = invitation.theme.backgroundImageUrl;
  const photoUrl = coverUrl && options.isTrustedPhotoUrl(coverUrl) ? coverUrl : null;

  const theme = invitation.theme;
  const primary = safeColor(theme.primaryColor, OG_BRAND_COLORS.primary);

  return {
    typeLabel: EVENT_TYPE_LABELS[invitation.type],
    heading,
    headingFontSize: headingFontSizeFor(heading, photoUrl !== null),
    dateLabel: heroDate ? formatIndonesianDate(heroDate) : null,
    photoUrl,
    footer: options.footer ?? "Undangan Digital",
    colors: {
      background: safeColor(theme.backgroundColor, OG_BRAND_COLORS.background),
      text: safeColor(theme.textColor, OG_BRAND_COLORS.text),
      primary,
      accent: safeColor(theme.accentColor, primary),
    },
  };
}
