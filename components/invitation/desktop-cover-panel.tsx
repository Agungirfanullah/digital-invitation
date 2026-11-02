import { themeToCssVars } from "@/components/invitation/theme-vars";
import { getHeroHeading, getHeroScheduleDate } from "@/lib/event-types/identity";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { formatIndonesianDate } from "@/lib/invitations/format";
import type { PublicInvitation } from "@/lib/invitations/types";
import { templateLook } from "@/components/invitation/template-look";

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

type PanelProps = {
  invitation: PublicInvitation;
  photoUrl: string | null;
  heroDate: string | null;
};

/**
 * Text-led layout for straight-edged, typographic templates (Modern
 * Editorial, Mono Frame, Industrial Loft): a left-aligned title block beside
 * a tall, square-cornered photo.
 */
function EditorialPanel({ invitation, photoUrl, heroDate }: PanelProps) {
  return (
    <div className="flex h-full items-center gap-12 px-14 py-14 xl:px-20">
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xs font-semibold tracking-[0.45em] text-[color:var(--ii-accent)] uppercase">
          {EVENT_TYPE_LABELS[invitation.type]}
        </p>
        <div className="mt-6 h-px w-16 bg-[color:var(--ii-accent)]" />
        <h2
          className="mt-8 text-6xl leading-[1.05] text-balance text-[color:var(--ii-primary)] xl:text-7xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {getHeroHeading(invitation)}
        </h2>
        {heroDate && (
          <p className="mt-8 text-sm font-medium tracking-[0.25em] text-[color:var(--ii-text)] uppercase">
            {formatIndonesianDate(heroDate)}
          </p>
        )}
      </div>
      <div className="relative h-[min(72vh,40rem)] w-[min(38%,22rem)] shrink-0">
        <div className="absolute inset-0 translate-x-3 translate-y-3 border border-[color:var(--ii-accent)]" />
        <div className="relative size-full overflow-hidden bg-[color:var(--ii-secondary)]/30">
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL.
            <img src={photoUrl} alt="" className="size-full object-cover" />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Photo-led layout for cinematic and dark templates (Dark Luxury, Cinematic
 * Journey): the cover photo fills the panel, the title sits at the bottom
 * on a dark gradient. Without a photo it falls back to a theme gradient.
 */
function FullbleedPanel({ invitation, photoUrl, heroDate }: PanelProps) {
  return (
    <div
      className="relative h-full"
      style={
        photoUrl
          ? undefined
          : {
              background:
                "linear-gradient(160deg, var(--ii-background), color-mix(in oklab, var(--ii-secondary) 45%, var(--ii-background)))",
            }
      }
    >
      {photoUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- external, event-owner-supplied URL. */}
          <img src={photoUrl} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        </>
      )}
      <div
        className={`absolute inset-x-0 bottom-0 px-14 pb-16 xl:px-20 ${
          photoUrl ? "text-white" : "text-[color:var(--ii-primary)]"
        }`}
      >
        <p
          className={`text-xs font-semibold tracking-[0.45em] uppercase ${
            photoUrl ? "text-white/80" : "text-[color:var(--ii-accent)]"
          }`}
        >
          {EVENT_TYPE_LABELS[invitation.type]}
        </p>
        <h2
          className="mt-5 max-w-2xl text-6xl leading-[1.05] text-balance xl:text-7xl"
          style={{ fontFamily: "var(--ii-heading-font)" }}
        >
          {getHeroHeading(invitation)}
        </h2>
        {heroDate && (
          <div className="mt-6 flex items-center gap-4">
            <span
              className={`h-px w-12 ${photoUrl ? "bg-white/60" : "bg-[color:var(--ii-accent)]"}`}
            />
            <p className="text-sm tracking-[0.25em] uppercase opacity-90">
              {formatIndonesianDate(heroDate)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The fixed left-hand "cover" shown beside the invitation's scrolling
 * column on wide (lg+) viewports only — the cover photo, heading and date
 * in one of five layouts chosen per template (`template-look.ts`), mirroring the desktop layout guests have come
 * to expect from digital invitations instead of stretching a mobile-first
 * template across the whole screen. Purely presentational and duplicated
 * from data already in the invitation, so it's `aria-hidden` (the real
 * heading lives in the column) and colored entirely from the event's own
 * theme variables, so it follows whichever template/theme is active.
 */
export function DesktopCoverPanel({ invitation }: { invitation: PublicInvitation }) {
  const photoUrl = invitation.theme.backgroundImageUrl;
  const heroDate = getHeroScheduleDate(invitation);
  // Templates whose own design briefs forbid the ornate frame (see each
  // template file's top comment) get another layout (template-look.ts).
  const variant = templateLook(invitation.templateKey).panel;

  return (
    <div
      aria-hidden="true"
      data-testid="desktop-cover-panel"
      style={themeToCssVars(invitation.theme)}
      className="fixed inset-y-0 right-[var(--invite-column)] left-0 hidden overflow-hidden bg-[color:var(--ii-background)] lg:block"
    >
      {variant === "editorial" && (
        <EditorialPanel invitation={invitation} photoUrl={photoUrl} heroDate={heroDate} />
      )}
      {variant === "fullbleed" && (
        <FullbleedPanel invitation={invitation} photoUrl={photoUrl} heroDate={heroDate} />
      )}
      {(variant === "ornate" || variant === "plain" || variant === "geometric") && (
        <ClassicPanel
          invitation={invitation}
          photoUrl={photoUrl}
          heroDate={heroDate}
          variant={variant}
        />
      )}
    </div>
  );
}

/** The original arched-photo layout, in ornate, plain or geometric dress. */
function ClassicPanel({
  invitation,
  photoUrl,
  heroDate,
  variant,
}: PanelProps & { variant: "ornate" | "plain" | "geometric" }) {
  const Corner = variant === "geometric" ? GeometricCorner : CornerOrnament;
  const frameShape = variant === "geometric" ? "" : "rounded-t-full";
  const glow =
    variant === "geometric"
      ? "0 0 0 10px color-mix(in oklab, var(--ii-accent) 12%, transparent)"
      : "0 0 70px 12px color-mix(in oklab, var(--ii-accent) 35%, transparent), 0 0 0 10px color-mix(in oklab, var(--ii-accent) 12%, transparent)";

  return (
    <>
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
    </>
  );
}
