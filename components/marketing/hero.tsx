import Link from "next/link";

import { Button } from "@/components/ui/button";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { buildDemoInvitation } from "@/lib/marketing/demo-invitation";

/**
 * Homepage Hero (docs/PRD.md §7, D-073). `ctaHref` is resolved once by
 * `app/page.tsx` (`/register` for an anonymous visitor, `/dashboard` for
 * an authenticated one — mirrors `app/(auth)/register/page.tsx`'s own
 * existing precedent) and passed down so this stays a plain, static
 * Server Component.
 *
 * The phone preview renders a real invitation through the same
 * `InvitationRenderer`/`buildDemoInvitation()` fabricated-demo-data path
 * as the Invitation Preview/Template Showcase sections further down —
 * not a screenshot, not a second rendering architecture. "Modern
 * Editorial" is picked here only for its bold hero typography; any other
 * template already appears later in Template Showcase.
 */
export function Hero({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="overflow-hidden px-6 py-16 sm:py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Undangan Digital yang Cantik, Personal, dan Berkesan.
          </h1>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg">
            Buat undangan dalam hitungan menit. Pilih desain, kelola tamu, bagikan lewat WhatsApp,
            dan pantau RSVP dari satu tempat.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button asChild size="lg">
              <Link href={ctaHref}>Buat Undangan</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#template-showcase">Lihat Template</a>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[280px]">
          <div
            className="bg-primary/15 absolute inset-0 -z-10 scale-125 rounded-full blur-3xl"
            aria-hidden
          />
          <PhoneFrame heightClassName="h-[560px]">
            <InvitationRenderer
              invitation={buildDemoInvitation("modern-editorial")}
              bypassOpening
            />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
