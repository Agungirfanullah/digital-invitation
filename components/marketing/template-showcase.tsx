"use client";

import { useState, type ReactNode } from "react";

import { getTemplateDefaultTheme } from "@/lib/invitations/templates/default-themes";

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
 * Each card's swatch/heading font comes from that template's own real
 * `getTemplateDefaultTheme()` palette — the same data the actual
 * invitation renders with — never an invented/decorative color.
 *
 * `previews` holds one already-server-rendered `InvitationRenderer` tree
 * per template slug (built by `app/page.tsx`, a Server Component, since
 * `buildDemoInvitation()` is `server-only` and can't run in this Client
 * Component). Clicking a card only toggles which already-rendered tree is
 * visible — no second rendering path, no client-side data fetch.
 */
export function TemplateShowcase({
  templates,
  previews,
}: {
  templates: TemplateOption[];
  previews: Record<string, ReactNode>;
}) {
  const [selectedSlug, setSelectedSlug] = useState(templates[0]?.slug ?? null);

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
          Setiap template punya gaya visual yang berbeda — klik untuk lihat tampilan aslinya.
        </p>
      </div>

      <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3">
        {templates.map((template) => {
          const theme = getTemplateDefaultTheme(template.slug);
          const isSelected = template.slug === selectedSlug;
          return (
            <li key={template.slug}>
              <button
                type="button"
                onClick={() => setSelectedSlug(template.slug)}
                aria-pressed={isSelected}
                className={`w-full overflow-hidden rounded-xl border text-left transition-shadow hover:shadow-sm ${
                  isSelected ? "ring-primary ring-2" : ""
                }`}
              >
                <div
                  className="flex h-20 items-center justify-center gap-1.5 px-3"
                  style={{ backgroundColor: theme.backgroundColor }}
                  aria-hidden
                >
                  {[theme.primaryColor, theme.accentColor, theme.secondaryColor].map((color) => (
                    <span
                      key={color}
                      className="size-4 rounded-full border border-black/5"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p
                  className="p-4 text-center font-medium"
                  style={{ fontFamily: theme.headingFont, color: theme.textColor }}
                >
                  {template.name}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedSlug && (
        <figure className="mx-auto mt-10 max-w-sm">
          <figcaption className="sr-only">
            Contoh tampilan template {templates.find((t) => t.slug === selectedSlug)?.name}
          </figcaption>
          <div className="bg-foreground/90 rounded-[2.5rem] border-8 border-black/80 p-2 shadow-xl">
            <div className="h-[650px] overflow-hidden overflow-y-auto rounded-[1.75rem]">
              {previews[selectedSlug]}
            </div>
          </div>
        </figure>
      )}
    </section>
  );
}
