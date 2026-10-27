import Link from "next/link";

import type { PublicPlan } from "@/lib/plans/service";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon } from "@/components/marketing/icons";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

/** The plan visually highlighted as the suggested default — an editorial choice, not a claim about sales/popularity data we don't have. */
const RECOMMENDED_PLAN_SLUG = "premium";

/**
 * Homepage Pricing (docs/PRD.md §8 item 10, §42, D-073). `plans` comes
 * from `getActivePlans()` (`lib/plans/service.ts`) — price and limits are
 * never hardcoded here (docs/DATABASE.md §25). Feature bullets are static
 * marketing copy matching `docs/PRD.md` §42 verbatim (per plan slug); the
 * PRD's own feature-bullet prose is the authoritative source for that
 * text, distinct from the plan's numeric `price`/`limits`.
 */
const PLAN_FEATURES: Record<string, string[]> = {
  free: ["Template terbatas", "RSVP dasar", "Branding platform"],
  premium: [
    "Template premium",
    "Tautan tamu personal",
    "Check-in QR",
    "Analitik",
    "Digital gift",
    "Slug kustom",
    "Tanpa branding",
  ],
  business: [
    "Beberapa acara sekaligus",
    "Anggota tim",
    "Manajemen tamu tingkat lanjut",
    "Analitik lanjutan",
  ],
};

function formatRupiah(price: number): string {
  if (price === 0) return "Gratis";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function Pricing({ plans, ctaHref }: { plans: PublicPlan[]; ctaHref: string }) {
  return (
    <section
      aria-labelledby="pricing-heading"
      className="bg-muted/30 relative overflow-hidden px-6 py-24 sm:py-32"
    >
      {/* Decorative background */}
      <div
        className="bg-primary/5 pointer-events-none absolute top-0 left-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 rounded-full blur-[120px]"
        aria-hidden="true"
      />

      <ScrollReveal className="mx-auto max-w-5xl text-center">
        <div className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm">
          <svg
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          Pilihan Paket Fleksibel
        </div>
        <h2
          id="pricing-heading"
          className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]"
        >
          Harga yang Jelas,{" "}
          <span className="from-primary text-gradient bg-gradient-to-r to-emerald-600">
            Tanpa Kejutan
          </span>
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
          Mulai gratis sekarang juga, upgrade kapan pun kamu membutuhkan fitur lebih lengkap dan
          tanpa batasan.
        </p>
      </ScrollReveal>

      <ul className="mx-auto mt-16 grid max-w-5xl grid-cols-1 items-stretch gap-6 sm:grid-cols-3">
        {plans.map((plan, i) => {
          const isRecommended = plan.slug === RECOMMENDED_PLAN_SLUG;
          return (
            <ScrollReveal key={plan.slug} delay={i * 150} direction="up">
              <li
                className={`bg-card relative flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:shadow-xl ${
                  isRecommended
                    ? "border-primary ring-primary/20 glow-primary z-10 shadow-xl ring-2 lg:-translate-y-3"
                    : "border-border/50 hover:border-primary/30 shadow-xs hover:-translate-y-1"
                }`}
              >
                {isRecommended && (
                  <span className="from-primary text-primary-foreground absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r to-emerald-600 px-4 py-1 text-xs font-bold tracking-wide shadow-md">
                    <span>★</span> Paling Populer
                  </span>
                )}

                <div>
                  <p className="text-foreground text-lg font-bold">{plan.name}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-foreground text-4xl font-extrabold tracking-tight">
                      {formatRupiah(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground text-sm font-medium">/bulan</span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    {plan.price === 0
                      ? "Cocok untuk mencoba fitur dasar"
                      : "Akses fitur penuh tanpa batas"}
                  </p>
                </div>

                <div className="via-border/60 my-6 h-px w-full bg-gradient-to-r from-transparent to-transparent" />

                <ul className="text-muted-foreground flex-1 space-y-3 text-sm">
                  {plan.maxEvents !== null && (
                    <li className="flex items-start gap-2.5">
                      <CheckCircleIcon className="text-primary mt-0.5 size-4 shrink-0" />
                      <span className="text-foreground/90 font-medium">
                        Hingga {plan.maxEvents} acara
                      </span>
                    </li>
                  )}
                  {plan.maxGuests !== null && (
                    <li className="flex items-start gap-2.5">
                      <CheckCircleIcon className="text-primary mt-0.5 size-4 shrink-0" />
                      <span className="text-foreground/90 font-medium">
                        Hingga {plan.maxGuests} tamu
                      </span>
                    </li>
                  )}
                  {(PLAN_FEATURES[plan.slug] ?? []).map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckCircleIcon className="text-primary mt-0.5 size-4 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`mt-8 w-full font-semibold transition-all ${
                    isRecommended
                      ? "from-primary h-12 bg-gradient-to-r to-emerald-600 shadow-lg hover:-translate-y-0.5 hover:opacity-95 hover:shadow-xl active:translate-y-0"
                      : "h-11 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                  }`}
                  variant={isRecommended ? "default" : "outline"}
                >
                  <Link href={ctaHref}>
                    {isRecommended ? "Mulai Sekarang" : "Buat Undangan"}
                    {isRecommended && (
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
                    )}
                  </Link>
                </Button>
              </li>
            </ScrollReveal>
          );
        })}
      </ul>

      <ScrollReveal className="mt-12 text-center" delay={450}>
        <div className="text-muted-foreground flex items-center justify-center gap-2.5 text-xs">
          <svg
            className="text-primary size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Tanpa biaya tersembunyi · Transparan & bisa upgrade kapan saja</span>
        </div>
      </ScrollReveal>
    </section>
  );
}
