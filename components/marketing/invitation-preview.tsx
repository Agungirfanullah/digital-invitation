import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { buildDemoInvitation } from "@/lib/marketing/demo-invitation";

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
    <section aria-labelledby="invitation-preview-heading" className="px-6 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <h2
          id="invitation-preview-heading"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Lihat Tampilan Undanganmu
        </h2>
        <p className="text-muted-foreground mt-2">
          Contoh undangan asli — bukan tangkapan layar. Begitulah tampilannya untuk tamumu.
        </p>
      </div>

      <figure className="mx-auto mt-10 max-w-sm">
        <figcaption className="sr-only">Contoh undangan digital</figcaption>
        <div className="h-[700px] overflow-hidden overflow-y-auto rounded-2xl border shadow-sm">
          <InvitationRenderer invitation={invitation} bypassOpening />
        </div>
      </figure>
    </section>
  );
}
