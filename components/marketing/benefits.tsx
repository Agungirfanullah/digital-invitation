import {
  CalendarCheckIcon,
  DashboardIcon,
  PaletteIcon,
  UsersIcon,
} from "@/components/marketing/icons";

const BENEFITS = [
  {
    title: "Desain siap pakai",
    description:
      "Pilih dari beberapa template siap pakai, lalu sesuaikan isinya tanpa perlu desainer.",
    icon: PaletteIcon,
  },
  {
    title: "Kelola tamu di satu tempat",
    description:
      "Tambahkan tamu satu per satu atau impor dari CSV, lengkap dengan tautan pribadi masing-masing.",
    icon: UsersIcon,
  },
  {
    title: "RSVP otomatis",
    description:
      "Tamu mengisi kehadiran langsung dari undangan, dan jawabannya langsung terlihat di dashboard.",
    icon: CalendarCheckIcon,
  },
  {
    title: "Pantau semuanya dari dashboard",
    description: "Kelola acara, tamu, dan undangan digitalmu dari satu dashboard yang sama.",
    icon: DashboardIcon,
  },
];

/** Homepage Product Benefits (docs/PRD.md §8 item 3, D-073) — static copy describing already-shipped capabilities only. */
export function Benefits() {
  return (
    <section aria-labelledby="benefits-heading" className="px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2
          id="benefits-heading"
          className="text-center text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Semua yang Kamu Butuhkan untuk Undangan Digital
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit.title}
              className="bg-card rounded-xl border p-6 transition-shadow hover:shadow-sm"
            >
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                <benefit.icon className="size-5" />
              </div>
              <p className="mt-4 font-medium">{benefit.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{benefit.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
