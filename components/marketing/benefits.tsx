import {
  CalendarCheckIcon,
  DashboardIcon,
  PaletteIcon,
  UsersIcon,
} from "@/components/marketing/icons";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

const BENEFITS = [
  {
    title: "Desain siap pakai",
    description:
      "Pilih dari beberapa template siap pakai, lalu sesuaikan isinya tanpa perlu desainer.",
    icon: PaletteIcon,
    gradient: "from-violet-500/15 via-purple-500/10 to-fuchsia-500/5",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    accent: "group-hover:border-violet-500/40",
  },
  {
    title: "Kelola tamu di satu tempat",
    description:
      "Tambahkan tamu satu per satu atau impor dari CSV, lengkap dengan tautan pribadi masing-masing.",
    icon: UsersIcon,
    gradient: "from-blue-500/15 via-sky-500/10 to-cyan-500/5",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    accent: "group-hover:border-blue-500/40",
  },
  {
    title: "RSVP otomatis",
    description:
      "Tamu mengisi kehadiran langsung dari undangan, dan jawabannya langsung terlihat di dashboard.",
    icon: CalendarCheckIcon,
    gradient: "from-emerald-500/15 via-green-500/10 to-teal-500/5",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    accent: "group-hover:border-emerald-500/40",
  },
  {
    title: "Pantau semuanya dari dashboard",
    description: "Kelola acara, tamu, dan undangan digitalmu dari satu dashboard yang sama.",
    icon: DashboardIcon,
    gradient: "from-amber-500/15 via-orange-500/10 to-yellow-500/5",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    accent: "group-hover:border-amber-500/40",
  },
];

/** Homepage Product Benefits (docs/PRD.md §8 item 3, D-073) — static copy describing already-shipped capabilities only. */
export function Benefits() {
  return (
    <section aria-labelledby="benefits-heading" className="relative px-6 py-24 sm:py-32 overflow-hidden">
      {/* Subtle gradient mesh */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        aria-hidden="true"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 20% 80%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-5xl">
        <ScrollReveal className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" />
            </svg>
            Fitur Terlengkap
          </div>
          <h2
            id="benefits-heading"
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] text-balance"
          >
            Semua yang Kamu Butuhkan untuk{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-600 text-gradient">Undangan Digital</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Dirancang khusus untuk mempermudah calon pengantin dan pemilik acara mengelola undangan dari persiapan hingga hari-H.
          </p>
        </ScrollReveal>

        <ul className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {BENEFITS.map((benefit, i) => (
            <ScrollReveal key={benefit.title} delay={i * 120} direction={i % 2 === 0 ? "left" : "right"}>
              <li
                className={`group relative flex flex-col rounded-2xl border border-border/50 bg-card p-7 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${benefit.accent}`}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${benefit.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} aria-hidden="true" />

                <div className="relative">
                  <div className={`${benefit.iconBg} flex size-12 items-center justify-center rounded-xl shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                    <benefit.icon className="size-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </li>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
