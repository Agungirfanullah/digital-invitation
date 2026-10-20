import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { buildDemoInvitation } from "@/lib/marketing/demo-invitation";
import { PhoneFrame } from "@/components/invitation/phone-frame";

/**
 * Homepage Invitation Preview (docs/PRD.md §8 item 5, D-073). Renders a
 * real invitation through the real `InvitationRenderer`/template system —
 * not a second rendering architecture — using fabricated demo data
 * (`buildDemoInvitation()`), never a real `Event`. `bypassOpening` is
 * required here (D-069): the Homepage is public marketing, not the guest
 * experience the Opening/Reveal gate is for.
 */
export function InvitationPreview() {
  const invitation = buildDemoInvitation();

  return (
    <section aria-labelledby="invitation-preview-heading" className="relative px-6 py-20 sm:py-28 overflow-hidden">
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          Pratinjau Interaktif
        </div>
        <h2
          id="invitation-preview-heading"
          className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl text-balance"
        >
          Lihat Tampilan Undanganmu
        </h2>
        <p className="text-muted-foreground mt-3 text-base max-w-2xl mx-auto leading-relaxed">
          Contoh undangan asli — bukan tangkapan layar statis. Begitulah keindahan tampilan yang akan dirasakan oleh setiap tamu undanganmu.
        </p>
      </div>

      <figure className="relative mx-auto mt-14 max-w-sm">
        {/* Ambient glow behind mockup */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full bg-primary/15 blur-3xl"
          aria-hidden="true"
        />
        <figcaption className="sr-only">Contoh undangan digital</figcaption>
        <div className="rounded-[3.2rem] p-2 ring-1 ring-border/50 shadow-2xl bg-card/60 backdrop-blur-xs">
          <PhoneFrame>
            <InvitationRenderer invitation={invitation} bypassOpening />
          </PhoneFrame>
        </div>
      </figure>
    </section>
  );
}
