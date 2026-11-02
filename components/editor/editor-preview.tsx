import type { PublicInvitation } from "@/lib/invitations/types";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { PhoneFrame } from "@/components/invitation/phone-frame";

/**
 * Renders through the exact same `InvitationRenderer` the public
 * `/invite/[slug]` route uses (see lib/editor/preview.ts for how the
 * `invitation` prop is assembled from live, possibly-unsaved editor
 * state) — there is no separate preview-only template.
 *
 * Shown inside the same phone mockup as the Homepage, at the real 390px
 * mobile width scaled to fit, so the owner sees what a guest's phone shows.
 * Rendered once only: the mobile overlay and the desktop column are the
 * same element, so its text never appears twice on the page.
 *
 * `bypassOpening` (docs/PRD.md §17, D-069): the owner must see and edit
 * content immediately, not click "Buka Undangan" on every keystroke-
 * triggered re-render — this never affects the actual public invitation.
 */
export function EditorPreview({
  invitation,
  onClose,
}: {
  invitation: PublicInvitation;
  /** Closes the full-screen preview on small screens; hidden on lg+. */
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-border/60 flex items-center justify-between gap-3 border-b px-5 py-3.5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Pratinjau langsung
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Perubahan yang belum tersimpan tetap tampil di sini.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pratinjau"
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 lg:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
            className="size-5"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div
        className="flex flex-1 justify-center overflow-y-auto px-6 py-6"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--foreground) 9%, transparent) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <div className="w-full max-w-[330px]">
          <PhoneFrame heightClassName="h-[min(680px,calc(100dvh-10rem))]">
            <InvitationRenderer invitation={invitation} bypassOpening />
          </PhoneFrame>
        </div>
      </div>
    </div>
  );
}
