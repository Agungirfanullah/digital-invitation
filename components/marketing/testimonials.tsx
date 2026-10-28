import { ScrollReveal } from "@/components/marketing/scroll-reveal";

/**
 * Homepage "why us" section, in the Testimonials slot (docs/PRD.md §8 item
 * 11, D-073). No real customer testimonials exist yet — inventing
 * names/quotes/ratings attributed to real people would be fabricated
 * social proof (CLAUDE.md §1.4/§1.5, D-072/D-073's explicit prohibition).
 * Uses truthful, non-attributed statements about the product instead,
 * never presented as a customer quote and never with star ratings.
 */
const STATEMENTS = [
  {
    lead: "Siap dalam hitungan menit.",
    text: "Pilih template dan isi detail acara, pratinjaunya langsung muncul di editor. Sisanya bisa dilengkapi kapan saja.",
  },
  {
    lead: "Satu dashboard untuk semuanya.",
    text: "Tamu, RSVP, ucapan, amplop digital, dan check-in tidak perlu dikelola di aplikasi yang berbeda-beda.",
  },
  {
    lead: "Tanpa perlu kemampuan desain.",
    text: "Setiap template sudah ditata. Kamu cukup mengganti isi, warna, dan font sesuai selera.",
  },
];

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden px-5 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="max-w-2xl">
          <p className="text-primary text-sm font-semibold">Kenapa kami</p>
          <h2
            id="testimonials-heading"
            className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Kenapa{" "}
            <span className="from-primary text-gradient bg-gradient-to-r to-emerald-500">
              Digital Invitation
            </span>
          </h2>
        </ScrollReveal>

        <ul className="border-border/70 mt-12 grid gap-px overflow-hidden rounded-3xl border bg-[var(--border)] md:grid-cols-3">
          {STATEMENTS.map((statement, index) => (
            <ScrollReveal key={statement.lead} as="li" delay={index * 120} className="bg-card">
              <div className="flex h-full flex-col p-7 sm:p-8">
                <span className="text-primary/30 text-5xl leading-none font-extrabold tabular-nums">
                  0{index + 1}
                </span>
                <p className="text-foreground mt-6 text-lg leading-snug font-bold tracking-tight">
                  {statement.lead}
                </p>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {statement.text}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
