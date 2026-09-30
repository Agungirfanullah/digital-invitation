import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Homepage closing CTA (docs/PRD.md §8 item 13, D-073) — same target as the Hero CTA, no separate acquisition flow. */
export function ClosingCta({ ctaHref }: { ctaHref: string }) {
  return (
    <section aria-labelledby="closing-cta-heading" className="px-6 py-20 text-center">
      <div className="mx-auto max-w-xl">
        <h2 id="closing-cta-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Siap Membuat Undangan Digitalmu?
        </h2>
        <p className="text-muted-foreground mt-3">
          Mulai gratis hari ini — undanganmu bisa siap dalam hitungan menit.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href={ctaHref}>Buat Undangan</Link>
        </Button>
      </div>
    </section>
  );
}
