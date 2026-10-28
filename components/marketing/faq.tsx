import { FAQ_ITEMS } from "@/lib/marketing/faq";

/**
 * Homepage FAQ (docs/PRD.md §8 item 12, D-073). The questions live in
 * `lib/marketing/faq.ts`, which also feeds the homepage's FAQPage JSON-LD.
 * Native `<details>` keeps it keyboard-accessible without client JS.
 */
export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading-title"
      className="bg-muted/40 relative overflow-hidden px-5 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-primary text-sm font-semibold">Pertanyaan umum</p>
          <h2
            id="faq-heading-title"
            className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl"
          >
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            Jawaban singkat seputar fitur, paket, dan cara membagikan undangan.
          </p>
        </div>

        <div className="divide-border/70 border-border/70 bg-card divide-y rounded-3xl border px-6 shadow-xs sm:px-8 lg:col-span-8">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group py-1">
              <summary className="text-foreground hover:text-primary flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-semibold transition-colors select-none marker:content-none [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="border-border text-muted-foreground group-open:bg-foreground group-open:text-background group-open:border-foreground flex size-7 shrink-0 items-center justify-center rounded-full border text-base transition-all duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-muted-foreground -mt-1 pr-10 pb-5 text-sm leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
