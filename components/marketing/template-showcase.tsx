import type { ReactNode } from "react";
import Link from "next/link";

import { PhoneFrame } from "@/components/invitation/phone-frame";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

interface TemplateOption {
  slug: string;
  name: string;
}

/**
 * Homepage Template Showcase (docs/PRD.md §8 item 2, D-073). Reuses the
 * same full, uncurated template list onboarding already shows
 * (`listTemplateOptions()` in `app/page.tsx`) — no curated Homepage
 * subset exists in the product contract (D-070/D-072).
 *
 * Each card shows that template's own real demo render (the same
 * fabricated "Ayu & Budi" demo data every other preview section uses —
 * `lib/marketing/demo-invitation.ts`) inside a small phone mockup, so the
 * cards are differentiated by each template's actual layout/typography —
 * never a stock/stand-in photo of real people, which this product has no
 * rights to use.
 *
 * `previews` holds one already-server-rendered `InvitationRenderer` tree
 * per template slug (built by `app/page.tsx`, a Server Component, since
 * `buildDemoInvitation()` is `server-only`).
 */
export function TemplateShowcase({
  templates,
  previews,
}: {
  templates: TemplateOption[];
  previews: Record<string, ReactNode>;
}) {
  return (
    <section
      id="template-showcase"
      aria-labelledby="template-showcase-heading"
      className="bg-muted/20 relative overflow-hidden px-6 py-24 sm:py-32"
    >
      {/* Decorative orbs */}
      <div
        className="bg-primary/6 pointer-events-none absolute top-20 left-[5%] -z-10 size-80 rounded-full blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="bg-accent/10 pointer-events-none absolute right-[5%] bottom-20 -z-10 size-64 rounded-full blur-[80px]"
        aria-hidden="true"
      />

      <ScrollReveal className="mx-auto max-w-4xl text-center">
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
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Koleksi Desain 2026
        </div>
        <h2
          id="template-showcase-heading"
          className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]"
        >
          Pilih Template{" "}
          <span className="from-primary text-gradient bg-gradient-to-r to-emerald-600">
            Favoritmu
          </span>
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
          Setiap template dirancang khusus dengan tipografi dan nuansa visual yang memukau. Coba
          langsung tampilan interaktif aslinya.
        </p>
      </ScrollReveal>

      <ul className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template, i) => (
          <ScrollReveal key={template.slug} delay={i * 100} direction="up">
            <li className="group border-border/50 bg-card hover:border-primary/40 relative flex flex-col items-center rounded-2xl border p-6 shadow-xs transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              {/* Hover glow overlay */}
              <div
                className="from-primary/5 absolute inset-0 rounded-2xl bg-gradient-to-b to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden="true"
              />

              <div className="relative w-full max-w-[220px] transition-transform duration-500 group-hover:scale-[1.03]">
                <PhoneFrame heightClassName="h-[360px]" compact>
                  {previews[template.slug]}
                </PhoneFrame>
              </div>

              <div className="relative mt-5 w-full text-center">
                <h3 className="text-foreground text-base font-bold tracking-tight">
                  {template.name}
                </h3>
                <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1.5 text-xs">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Mobile-first & Responsif
                </p>

                <Link
                  href={`/demo/${template.slug}`}
                  target="_blank"
                  className="border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground mt-4 inline-flex items-center gap-1.5 rounded-full border px-5 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                >
                  Lihat Demo Penuh
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-3.5"
                    aria-hidden="true"
                  >
                    <path d="M7 17l9.2-9.2M17 17V8H8" />
                  </svg>
                </Link>
              </div>
            </li>
          </ScrollReveal>
        ))}
      </ul>
    </section>
  );
}
