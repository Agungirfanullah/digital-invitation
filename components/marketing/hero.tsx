import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Homepage Hero (docs/PRD.md §7, D-073). `ctaHref` is resolved once by
 * `app/page.tsx` (`/register` for an anonymous visitor, `/dashboard` for
 * an authenticated one — mirrors `app/(auth)/register/page.tsx`'s own
 * existing precedent) and passed down so this stays a plain, static
 * Server Component.
 */
export function Hero({ ctaHref }: { ctaHref: string }) {
  return (
    <section className="px-6 py-20 text-center sm:py-28">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Undangan Digital yang Cantik, Personal, dan Berkesan.
        </h1>
        <p className="text-muted-foreground mt-4 text-base sm:text-lg">
          Buat undangan dalam hitungan menit. Pilih desain, kelola tamu, bagikan lewat WhatsApp, dan
          pantau RSVP dari satu tempat.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={ctaHref}>Buat Undangan</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#template-showcase">Lihat Template</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
