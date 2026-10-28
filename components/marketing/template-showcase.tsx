import type { ReactNode } from "react";

import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { TemplateCarousel, type ShowcaseTemplate } from "@/components/marketing/template-carousel";

/**
 * Homepage Template Showcase (docs/PRD.md §8 item 2, D-073). Reuses the
 * same full, uncurated template list onboarding already shows
 * (`listTemplateOptions()` in `app/page.tsx`) — no curated Homepage
 * subset exists in the product contract (D-070/D-072). A style filter
 * (`lib/marketing/template-styles.ts`) and a horizontal carousel keep all
 * of them one swipe away without a screens-long grid.
 *
 * Each card shows that template's own real demo render inside a small
 * phone mockup. `previews` holds one already-server-rendered
 * `InvitationRenderer` tree per template slug (built by `app/page.tsx`,
 * since the demo builders are `server-only`).
 */
export function TemplateShowcase({
  templates,
  previews,
}: {
  templates: ShowcaseTemplate[];
  previews: Record<string, ReactNode>;
}) {
  return (
    <section
      id="template-showcase"
      aria-labelledby="template-showcase-heading"
      className="relative overflow-hidden py-20 sm:py-28"
    >
      <ScrollReveal className="mx-auto max-w-3xl px-5 text-center sm:px-6">
        <p className="text-primary text-sm font-semibold">{templates.length} desain siap pakai</p>
        <h2
          id="template-showcase-heading"
          className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl"
        >
          Pilih Template{" "}
          <span className="from-primary text-gradient bg-gradient-to-r to-emerald-500">
            Favoritmu
          </span>
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
          Setiap template punya tata letak, tipografi, dan ornamennya sendiri. Geser untuk melihat,
          lalu buka demo penuh persis seperti yang akan dilihat tamumu.
        </p>
      </ScrollReveal>

      <TemplateCarousel templates={templates} previews={previews} />
    </section>
  );
}
