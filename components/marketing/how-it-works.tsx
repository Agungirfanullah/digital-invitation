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
    <section aria-labelledby="how-it-works-heading" className="bg-muted/30 px-6 py-24 sm:py-32 relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div
        className="pointer-events-none absolute top-0 right-0 -z-10 size-[500px] rounded-full bg-primary/5 blur-[120px]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl">
        <ScrollReveal className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Langkah Cepat & Mudah
          </div>
          <h2
            id="how-it-works-heading"
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] text-balance"
          >
            Cara Kerjanya
          </h2>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Hanya butuh beberapa menit dari pendaftaran hingga undangan siap dikirimkan ke keluarga dan teman.
          </p>
        </ScrollReveal>

        <ol className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden lg:block absolute top-[3.25rem] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30"
            aria-hidden="true"
          />

          {STEPS.map((step, index) => (
            <ScrollReveal key={step.title} delay={index * 150} direction="up">
              <li
                className="group relative flex flex-col rounded-2xl border border-border/50 bg-card p-6 shadow-xs transition-all duration-300 hover:shadow-lg hover:border-primary/40 hover:-translate-y-1"
              >
                {/* Step number with glow */}
                <div className="flex items-center justify-between">
                  <div className="relative">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-md transition-transform duration-300 group-hover:scale-110">
                      0{index + 1}
                    </span>
                    {/* Glow ring */}
                    <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                  </div>
                  <span className="text-2xl transition-transform duration-300 group-hover:scale-125" aria-hidden="true">
                    {step.emoji}
                  </span>
                </div>

                <h3 className="mt-6 font-bold text-foreground text-base tracking-tight">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed flex-1">{step.description}</p>

                {/* Bottom progress indicator */}
                <div className="mt-5 h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 group-hover:w-full"
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
