import { themeToCssVars } from "@/components/invitation/theme-vars";
import { getHeroHeading, getHeroScheduleDate } from "@/lib/event-types/identity";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { formatIndonesianDate } from "@/lib/invitations/format";
import type { PublicInvitation } from "@/lib/invitations/types";

function CornerOrnament({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="var(--ii-accent)"
      strokeWidth={1.25}
      strokeLinecap="round"
    >
      <path d="M6 114V6h108" />
      <path d="M14 106V14h92" opacity={0.5} />
      <path d="M6 6c10 0 16 6 16 16-8 0-12-4-12-10" />
      <circle cx="22" cy="22" r="2" fill="var(--ii-accent)" stroke="none" />
    </svg>
  );
}

function TopFlourish({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 48"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="var(--ii-accent)"
      strokeWidth={1.25}
      strokeLinecap="round"
    >
      <path d="M80 6c-6 8-6 16 0 24 6-8 6-16 0-24Z" fill="var(--ii-accent)" fillOpacity={0.25} />
      <path d="M80 30c-10-10-24-10-30 0 6 6 16 6 22-2" />
      <path d="M80 30c10-10 24-10 30 0-6 6-16 6-22-2" />
      <path d="M50 30c-10 0-18 4-26 4M110 30c10 0 18 4 26 4" />
      <path d="M24 34c-6 0-10-2-14-6M136 34c6 0 10-2 14-6" />
      <circle cx="10" cy="28" r="2" fill="var(--ii-accent)" stroke="none" />
      <circle cx="150" cy="28" r="2" fill="var(--ii-accent)" stroke="none" />
      <path d="M80 34v8" />
      <circle cx="80" cy="44" r="2" fill="var(--ii-accent)" stroke="none" />
    </svg>
  );
}

function Sprig({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 48"
      aria-hidden="true"
      className={`h-10 w-8 shrink-0 ${flip ? "-scale-x-100" : ""}`}
      fill="none"
      stroke="var(--ii-accent)"
      strokeWidth={1.25}
      strokeLinecap="round"
    >
      <path d="M20 46V12" />
      <path d="M20 4c-3 3-3 6 0 8 3-2 3-5 0-8Z" fill="var(--ii-accent)" stroke="none" />
      <path d="M20 22c-6-2-10 2-10 8 6 0 10-3 10-8ZM20 30c6-2 10 2 10 8-6 0-10-3-10-8Z" />
      <path d="M4 46h32" />
    </svg>
  );
}

function GeometricCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="var(--ii-accent)"
      strokeWidth={1.5}
    >
      <path d="M6 70V6h64" />
      <path d="M16 40V16h24" />
    </svg>
  );
}

/**
 * Some templates' own design briefs forbid what the default ornate panel
 * draws (see each template file's top comment): Mono Frame/Art Deco/
 * Industrial Loft/Modern Editorial/Minimal Elegant stay straight-edged,
 * and Soft Romantic allows no botanical or geometric motifs at all.
 */
const GEOMETRIC_TEMPLATES = new Set([
  "mono-frame",
  "art-deco",
  "industrial-loft",
  "modern-editorial",
  "minimal-elegant",
]);
const PLAIN_TEMPLATES = new Set(["soft-romantic"]);

type PanelVariant = "ornate" | "geometric" | "plain";

function panelVariant(templateKey: string | null): PanelVariant {
  if (templateKey && GEOMETRIC_TEMPLATES.has(templateKey)) return "geometric";
  if (templateKey && PLAIN_TEMPLATES.has(templateKey)) return "plain";
  return "ornate";
}

/**
 * The fixed left-hand "cover" shown beside the invitation's scrolling
 * column on wide (lg+) viewports only — a large arched photo, ornamental
 * frame, heading and date, mirroring the desktop layout guests have come
 * to expect from digital invitations instead of stretching a mobile-first
 * template across the whole screen. Purely presentational and duplicated
 * from data already in the invitation, so it's `aria-hidden` (the real
 * heading lives in the column) and colored entirely from the event's own
 * theme variables, so it follows whichever template/theme is active.
 */
export function DesktopCoverPanel({ invitation }: { invitation: PublicInvitation }) {
  const photoUrl = invitation.theme.backgroundImageUrl;
  const heroDate = getHeroScheduleDate(invitation);
  const variant = panelVariant(invitation.templateKey);
  const Corner = variant === "geometric" ? GeometricCorner : CornerOrnament;
  const frameShape = variant === "geometric" ? "" : "rounded-t-full";
  const glow =
    variant === "geometric"
      ? "0 0 0 10px color-mix(in oklab, var(--ii-accent) 12%, transparent)"
      : "0 0 70px 12px color-mix(in oklab, var(--ii-accent) 35%, transparent), 0 0 0 10px color-mix(in oklab, var(--ii-accent) 12%, transparent)";

  return (
    <div
      aria-hidden="true"
      data-testid="desktop-cover-panel"
      style={themeToCssVars(invitation.theme)}
      className="fixed inset-y-0 right-[var(--invite-column)] left-0 hidden overflow-hidden bg-[color:var(--ii-background)] lg:block"
    >
      {variant !== "plain" && (
        <>
          <Corner className="absolute top-4 left-4 size-24" />
          <Corner className="absolute top-4 right-4 size-24 -scale-x-100" />
          <Corner className="absolute bottom-4 left-4 size-24 -scale-y-100" />
          <Corner className="absolute right-4 bottom-4 size-24 -scale-100" />
        </>
      )}

      <div className="flex h-full flex-col items-center justify-center gap-5 px-16 py-12 text-center">
        {variant === "ornate" && <TopFlourish className="h-10 w-36" />}

        <div className="flex items-end gap-4">
          {variant === "ornate" && <Sprig />}
          <p
            className={`pb-1 text-[color:var(--ii-accent)] ${
              variant === "geometric" ? "text-sm tracking-[0.4em] uppercase" : "text-xl"
            }`}
            style={{ fontFamily: "var(--ii-heading-font)" }}
          >
            {EVENT_TYPE_LABELS[invitation.type]}
          </p>
          {variant === "ornate" && <Sprig flip />}
        </div>

        <div
          className={`relative mt-2 aspect-[3/4] h-[min(52vh,30rem)] overflow-hidden border-4 border-[color:var(--ii-primary)] ${frameShape}`}
          style={{ boxShadow: glow }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
            <img src={photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full bg-[color:var(--ii-secondary)]/30" />
          )}
        </div>

        <h2
          className="mt-4 max-w-xl text-5xl text-balance text-[color:var(--ii-primary)] xl:text-6xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {getHeroHeading(invitation)}
        </h2>
        {heroDate && (
          <p className="text-base tracking-wide text-[color:var(--ii-accent)]">
            {formatIndonesianDate(heroDate)}
          </p>
        )}
      </div>
    </div>
  );
}
