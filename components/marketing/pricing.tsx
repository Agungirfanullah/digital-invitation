import Link from "next/link";

import type { PublicPlan } from "@/lib/plans/service";
import { Button } from "@/components/ui/button";

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
    <section aria-labelledby="pricing-heading" className="bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <h2 id="pricing-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Harga yang Jelas, Tanpa Kejutan
        </h2>
        <p className="text-muted-foreground mt-2">
          Mulai gratis, upgrade kapan pun kamu butuh lebih.
        </p>
      </div>

      <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <li key={plan.slug} className="bg-background flex flex-col rounded-lg border p-6">
            <p className="font-medium">{plan.name}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {formatRupiah(plan.price)}
              {plan.price > 0 && (
                <span className="text-muted-foreground text-sm font-normal">/bulan</span>
              )}
            </p>
            <ul className="text-muted-foreground mt-4 space-y-1.5 text-sm">
              {plan.maxEvents !== null && <li>Hingga {plan.maxEvents} acara</li>}
              {plan.maxGuests !== null && <li>Hingga {plan.maxGuests} tamu</li>}
              {(PLAN_FEATURES[plan.slug] ?? []).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Button asChild className="mt-6">
              <Link href={ctaHref}>Buat Undangan</Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
