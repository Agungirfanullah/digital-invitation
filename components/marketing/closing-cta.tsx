import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

/** Homepage closing CTA (docs/PRD.md §8 item 13, D-073) — same target as the Hero CTA, no separate acquisition flow. */
export function ClosingCta({ ctaHref }: { ctaHref: string }) {
  return (
    <section
      aria-labelledby="closing-cta-heading"
      className="relative overflow-hidden px-6 py-24 sm:py-32"
    >
      <ScrollReveal direction="none">
        <div className="border-primary/20 relative mx-auto max-w-4xl overflow-hidden rounded-3xl border shadow-xl">
          {/* Multi-gradient background */}
          <div
            className="from-primary/15 via-primary/8 to-accent/10 absolute inset-0 bg-gradient-to-br"
            aria-hidden="true"
          />
          <div
            className="from-card/50 absolute inset-0 bg-gradient-to-t to-transparent"
            aria-hidden="true"
          />

          {/* Decorative orbs */}
          <div
            className="bg-primary/20 pointer-events-none absolute -top-20 -left-20 size-60 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-20 -bottom-20 size-60 rounded-full bg-emerald-500/15 blur-3xl"
            aria-hidden="true"
          />

          {/* Dot pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            aria-hidden="true"
            style={{
              backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative p-10 text-center sm:p-16">
            <div className="mx-auto max-w-2xl">
              <div className="border-primary/25 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-xs backdrop-blur-sm">
                ✨ Mulai Sekarang Tanpa Biaya
              </div>
              <h2
                id="closing-cta-heading"
                className="text-foreground mt-5 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl"
              >
                Siap Membuat{" "}
                <span className="from-primary text-gradient bg-gradient-to-r to-emerald-600">
                  Undangan Digital
                </span>
                mu?
              </h2>
              <p className="text-muted-foreground mt-5 text-base leading-relaxed sm:text-lg">
                Mulai gratis hari ini — undanganmu bisa siap dalam hitungan menit dan siap dibagikan
                ke seluruh keluarga serta sahabat.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="glow-primary h-13 px-10 text-base font-semibold shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-xl active:translate-y-0"
                >
                  <Link href={ctaHref}>
                    Buat Undangan Sekarang
                    <svg
                      className="ml-2 size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </Button>
                <p className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="bg-primary size-1 rounded-full" aria-hidden="true" />
                    Bebas pilih template
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <span className="bg-primary size-1 rounded-full" aria-hidden="true" />
                    Personalisasi instan
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <span className="bg-primary size-1 rounded-full" aria-hidden="true" />
                    Tanpa ribet
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
