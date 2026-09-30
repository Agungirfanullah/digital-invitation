interface TemplateOption {
  slug: string;
  name: string;
}

/**
 * Homepage Template Showcase (docs/PRD.md §8 item 2, D-073). Reuses the
 * same full, uncurated template list onboarding already shows
 * (`listTemplateOptions()` in `app/page.tsx`) — no curated Homepage
 * subset exists in the product contract (D-070/D-072).
 */
export function TemplateShowcase({ templates }: { templates: TemplateOption[] }) {
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
          Setiap template punya gaya visual yang berbeda — tinggal pilih yang paling cocok untuk
          acaramu.
        </p>
      </div>

      <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3">
        {templates.map((template) => (
          <li key={template.slug} className="rounded-lg border p-5 text-center">
            <p className="font-medium">{template.name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
