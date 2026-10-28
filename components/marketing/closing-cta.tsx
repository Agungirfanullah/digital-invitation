import Link from "next/link";

import { ArrowRightIcon } from "@/components/marketing/icons";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

/** Homepage closing CTA (docs/PRD.md §8 item 13, D-073) — same target as the Hero CTA, no separate acquisition flow. */
export function ClosingCta({ ctaHref }: { ctaHref: string }) {
  return (
    <section aria-labelledby="closing-cta-heading" className="px-5 py-20 sm:px-6 sm:py-28">
      <ScrollReveal direction="none">
        <div className="from-primary relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br via-emerald-700 to-emerald-900 px-6 py-16 text-center text-white shadow-2xl shadow-emerald-950/25 sm:px-12 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse 60% 70% at 50% 50%, black, transparent)",
              WebkitMaskImage: "radial-gradient(ellipse 60% 70% at 50% 50%, black, transparent)",
            }}
          />
          <div
            className="animate-float-gentle pointer-events-none absolute -top-24 -left-24 -z-10 size-72 rounded-full bg-emerald-300/25 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-20 -bottom-28 -z-10 size-80 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />

          <h2
            id="closing-cta-heading"
            className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Siap Membuat Undangan Digitalmu?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Mulai gratis hari ini. Pilih template, isi detail acaramu, dan bagikan ke keluarga serta
            sahabat saat sudah siap.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={ctaHref}
              className="group text-primary inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-base font-semibold shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Buat Undangan Sekarang
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#template-showcase"
              className="inline-flex h-12 items-center rounded-full border border-white/30 px-7 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              Jelajahi template
            </a>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
