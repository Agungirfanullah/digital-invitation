import { ScrollReveal } from "@/components/marketing/scroll-reveal";

/**
 * Homepage "How It Works" (docs/PRD.md §8 item 4, D-073). Describes the
 * actual product flow (register → onboarding → editor → publish
 * separately, D-071/F4) — never a simplified flow that implies Homepage
 * creates or publishes an event directly.
 */
const STEPS = [
  {
    title: "Daftar",
    description: "Buat akun gratis dalam waktu singkat.",
    emoji: "✍️",
  },
  {
    title: "Isi detail acara",
    description: "Jawab beberapa pertanyaan singkat: jenis acara, nama, tanggal, dan template.",
    emoji: "📝",
  },
  {
    title: "Lengkapi di editor",
    description: "Sempurnakan undangan — jadwal, galeri, tamu, dan lainnya — di editor undanganmu.",
    emoji: "🎨",
  },
  {
    title: "Publikasikan & bagikan",
    description: "Publikasikan saat sudah siap, lalu bagikan tautannya ke tamu melalui WhatsApp.",
    emoji: "🚀",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="bg-muted/30 relative overflow-hidden px-6 py-24 sm:py-32"
    >
      {/* Decorative gradient orb */}
      <div
        className="bg-primary/5 pointer-events-none absolute top-0 right-0 -z-10 size-[500px] rounded-full blur-[120px]"
        aria-hidden="true"
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
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Langkah Cepat & Mudah
          </div>
          <h2
            id="how-it-works-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]"
          >
            Cara Kerjanya
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            Hanya butuh beberapa menit dari pendaftaran hingga undangan siap dikirimkan ke keluarga
            dan teman.
          </p>
        </ScrollReveal>

        <ol className="relative mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connecting line (desktop only) */}
          <div
            className="from-primary/30 via-primary/50 to-primary/30 absolute top-[3.25rem] right-[12.5%] left-[12.5%] hidden h-px bg-gradient-to-r lg:block"
            aria-hidden="true"
          />

          {STEPS.map((step, index) => (
            <ScrollReveal key={step.title} delay={index * 150} direction="up">
              <li className="group border-border/50 bg-card hover:border-primary/40 relative flex flex-col rounded-2xl border p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                {/* Step number with glow */}
                <div className="flex items-center justify-between">
                  <div className="relative">
                    <span className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-2xl text-sm font-bold shadow-md transition-transform duration-300 group-hover:scale-110">
                      0{index + 1}
                    </span>
                    {/* Glow ring */}
                    <div
                      className="bg-primary/20 absolute inset-0 rounded-2xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </div>
                  <span
                    className="text-2xl transition-transform duration-300 group-hover:scale-125"
                    aria-hidden="true"
                  >
                    {step.emoji}
                  </span>
                </div>

                <h3 className="text-foreground mt-6 text-base font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Bottom progress indicator */}
                <div className="bg-muted mt-5 h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="from-primary h-full rounded-full bg-gradient-to-r to-emerald-500 transition-all duration-500 group-hover:w-full"
                    style={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
              </li>
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
