import type { ReactNode } from "react";
import Link from "next/link";

import { PhoneFrame } from "@/components/marketing/phone-frame";

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
      className="px-6 py-16"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2
          id="template-showcase-heading"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Pilih Template Favoritmu
        </h2>
        <p className="text-muted-foreground mt-2">
          Setiap template punya gaya visual yang berbeda — ini tampilan aslinya, bukan contoh.
        </p>
      </div>

      <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <li key={template.slug} className="flex flex-col items-center">
            <div className="w-full max-w-[220px]">
              <PhoneFrame heightClassName="h-[360px]" compact>
                {previews[template.slug]}
              </PhoneFrame>
            </div>
            <p className="mt-4 text-center font-medium">{template.name}</p>
            <Link
              href={`/demo/${template.slug}`}
              target="_blank"
              className="text-primary mt-1 text-sm underline-offset-2 hover:underline"
            >
              Lihat Demo Penuh
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
