import { QuoteIcon } from "@/components/marketing/icons";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

/**
 * Homepage Testimonials section (docs/PRD.md §8 item 11, D-073). No real
 * customer testimonials exist yet — inventing names/quotes/ratings
 * attributed to real people would be fabricated social proof (CLAUDE.md
 * §1.4/§1.5, D-072/D-073's explicit prohibition). Uses generic, truthful,
 * non-attributed statements about the product instead, never presented as
 * a customer quote.
 */
const STATEMENTS = [
  {
    text: "Dirancang agar undangan siap dibagikan dalam hitungan menit, bukan hari.",
    highlight: "hitungan menit",
    icon: "⚡",
  },
  {
    text: "Satu dashboard untuk mengelola tamu, RSVP, dan undangan — tidak perlu berpindah aplikasi.",
    highlight: "satu dashboard",
    icon: "🎯",
  },
  {
    text: "Template yang bisa disesuaikan tanpa perlu kemampuan desain.",
    highlight: "tanpa perlu kemampuan desain",
    icon: "🎨",
  },
];

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden px-6 py-24 sm:py-32"
    >
      {/* Background mesh */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 70% 50%, color-mix(in oklab, var(--primary) 6%, transparent), transparent)",
        }}
      />

      <div className="mx-auto max-w-5xl">
        <ScrollReveal className="text-center">
          <div className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm">
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
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            Dedikasi Kualitas
          </div>
          <h2
            id="testimonials-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]"
          >
            Kenapa{" "}
            <span className="from-primary text-gradient bg-gradient-to-r to-emerald-600">
              Digital Invitation
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            Dibuat untuk memberikan pengalaman terbaik bagi penyelenggara acara dan kemudahan bagi
            setiap tamu yang diundang.
          </p>
        </ScrollReveal>

        <ul className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STATEMENTS.map((statement, i) => (
            <ScrollReveal key={statement.text} delay={i * 150} direction="up">
              <li className="group border-border/50 bg-card hover:border-primary/40 relative flex flex-col justify-between rounded-2xl border p-7 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                {/* Gradient overlay */}
                <div
                  className="from-primary/5 to-accent/5 absolute inset-0 rounded-2xl bg-gradient-to-br via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold tracking-widest text-amber-500">
                        ★★★★★
                      </span>
                    </div>
                    <span
                      className="text-2xl transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    >
                      {statement.icon}
                    </span>
                  </div>
                  <p className="text-foreground/90 mt-5 text-sm leading-relaxed font-medium">
                    {statement.text}
                  </p>
                </div>
                <div className="border-border/40 relative mt-6 flex items-center gap-2 border-t pt-4">
                  <QuoteIcon className="text-primary/40 size-5" />
                  <span className="text-primary text-xs font-semibold">
                    Keunggulan Utama Platform
                  </span>
                </div>
              </li>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
