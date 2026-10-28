import type { ReactNode } from "react";
import Link from "next/link";

import type { PublicPlan } from "@/lib/plans/service";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, CheckIcon } from "@/components/marketing/icons";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

/** What the free plan gives today, while no plan limit is enforced — all shipped features. */
const AVAILABLE_NOW = [
  "Semua template",
  "Tamu, RSVP, dan ucapan",
  "Kirim tautan pribadi via WhatsApp",
  "Check-in QR dan analitik",
  "Amplop digital",
];

/** One line under each plan's price. */
const PLAN_TAGLINES: Record<string, string> = {
  free: "Semua fitur terbuka selama masa awal",
  premium: "Untuk acara spesialmu, dengan fitur lengkap",
  business: "Untuk penyelenggara banyak acara",
};

/**
 * Homepage Pricing (docs/PRD.md §8 item 10, §42, D-073). `plans` comes
 * from `getActivePlans()` (`lib/plans/service.ts`) — price and limits are
 * never hardcoded here (docs/DATABASE.md §25). Feature bullets are static
 * marketing copy matching `docs/PRD.md` §42 verbatim (per plan slug); the
 * PRD's own feature-bullet prose is the authoritative source for that
 * text, distinct from the plan's numeric `price`/`limits`.
 *
 * Paid plans cannot be bought yet: there is no checkout and no plan
 * enforcement (Roadmap Phase 18, STATUS open item 1). Until there is, the
 * free plan is the highlighted, available one, paid plans are marked
 * "Segera hadir", and the section says the limits do not apply yet (D-095).
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
      id="harga"
      aria-labelledby="pricing-heading"
      className="bg-muted/40 relative overflow-hidden px-5 py-20 sm:px-6 sm:py-28"
    >
      <ScrollReveal className="mx-auto max-w-3xl text-center">
        <p className="text-primary text-sm font-semibold">Paket langganan</p>
        <h2
          id="pricing-heading"
          className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl"
        >
          Harga yang Jelas,{" "}
          <span className="from-primary text-gradient bg-gradient-to-r to-emerald-500">
            Tanpa Kejutan
          </span>
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
          Mulai gratis sekarang. Pembayaran paket berbayar belum dibuka, jadi selama masa awal semua
          fitur bisa kamu pakai tanpa biaya.
        </p>
      </ScrollReveal>

      <ul className="mx-auto mt-14 grid max-w-5xl grid-cols-1 items-start gap-5 md:grid-cols-3">
        {plans.map((plan, i) => {
          // Only a free plan can be used today; it is the highlighted card.
          const isRecommended = plan.price === 0;
          return (
            <ScrollReveal key={plan.slug} as="li" delay={i * 120} className="h-full">
              <article
                className={`relative flex h-full flex-col rounded-3xl p-7 transition-all duration-300 sm:p-8 ${
                  isRecommended
                    ? "bg-foreground text-background shadow-2xl shadow-emerald-950/25 md:-translate-y-3"
                    : "border-border/70 bg-card hover:border-primary/30 border shadow-xs hover:-translate-y-1 hover:shadow-lg"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={`text-base font-semibold ${isRecommended ? "" : "text-foreground"}`}
                  >
                    {plan.name}
                  </h3>
                  {isRecommended ? (
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      Tersedia sekarang
                    </span>
                  ) : (
                    <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-semibold">
                      Segera hadir
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {formatRupiah(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span
                      className={`text-sm font-medium ${isRecommended ? "text-background/60" : "text-muted-foreground"}`}
                    >
                      /bulan
                    </span>
                  )}
                </div>
                <p
                  className={`mt-2 text-sm ${isRecommended ? "text-background/60" : "text-muted-foreground"}`}
                >
                  {PLAN_TAGLINES[plan.slug] ?? ""}
                </p>

                <Button
                  asChild
                  variant={isRecommended ? "default" : "outline"}
                  className={`group mt-7 h-11 w-full rounded-full font-semibold ${
                    isRecommended
                      ? "bg-emerald-500 text-white hover:bg-emerald-400"
                      : "hover:bg-muted"
                  }`}
                >
                  <Link href={ctaHref}>
                    {isRecommended ? "Mulai Gratis" : "Mulai gratis dulu"}
                    <ArrowRightIcon className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>

                <ul
                  className={`mt-7 flex-1 space-y-3 border-t pt-7 text-sm ${
                    isRecommended ? "border-background/15" : "border-border/60"
                  }`}
                >
                  {isRecommended ? (
                    AVAILABLE_NOW.map((feature) => (
                      <PlanFeature key={feature} highlight>
                        {feature}
                      </PlanFeature>
                    ))
                  ) : (
                    <>
                      {plan.maxEvents !== null && (
                        <PlanFeature highlight={false}>
                          <strong className="font-semibold">Hingga {plan.maxEvents} acara</strong>
                        </PlanFeature>
                      )}
                      {plan.maxGuests !== null && (
                        <PlanFeature highlight={false}>
                          <strong className="font-semibold">Hingga {plan.maxGuests} tamu</strong>
                        </PlanFeature>
                      )}
                      {(PLAN_FEATURES[plan.slug] ?? []).map((feature) => (
                        <PlanFeature key={feature} highlight={false}>
                          {feature}
                        </PlanFeature>
                      ))}
                    </>
                  )}
                </ul>
              </article>
            </ScrollReveal>
          );
        })}
      </ul>

      <p className="text-muted-foreground mx-auto mt-10 max-w-2xl text-center text-sm">
        Batas acara, tamu, dan fitur per paket di atas mulai berlaku saat paket berbayar dibuka.
      </p>
    </section>
  );
}

function PlanFeature({ children, highlight }: { children: ReactNode; highlight: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full ${
          highlight ? "bg-emerald-400/20 text-emerald-300" : "bg-primary/10 text-primary"
        }`}
      >
        <CheckIcon className="size-3" />
      </span>
      <span className={highlight ? "text-background/85" : "text-foreground/80"}>{children}</span>
    </li>
  );
}
