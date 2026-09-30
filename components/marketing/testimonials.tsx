/**
 * Homepage Testimonials section (docs/PRD.md §8 item 11, D-073). No real
 * customer testimonials exist yet — inventing names/quotes/ratings
 * attributed to real people would be fabricated social proof (CLAUDE.md
 * §1.4/§1.5, D-072/D-073's explicit prohibition). Uses generic, truthful,
 * non-attributed statements about the product instead, never presented as
 * a customer quote.
 */
const STATEMENTS = [
  "Dirancang agar undangan siap dibagikan dalam hitungan menit, bukan hari.",
  "Satu dashboard untuk mengelola tamu, RSVP, dan undangan — tidak perlu berpindah aplikasi.",
  "Template yang bisa disesuaikan tanpa perlu kemampuan desain.",
];

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2
          id="testimonials-heading"
          className="text-center text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Kenapa Digital Invitation
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STATEMENTS.map((statement) => (
            <li key={statement} className="rounded-lg border p-5 text-center text-sm">
              {statement}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
