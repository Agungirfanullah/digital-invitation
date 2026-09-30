const BENEFITS = [
  {
    title: "Desain siap pakai",
    description:
      "Pilih dari beberapa template siap pakai, lalu sesuaikan isinya tanpa perlu desainer.",
  },
  {
    title: "Kelola tamu di satu tempat",
    description:
      "Tambahkan tamu satu per satu atau impor dari CSV, lengkap dengan tautan pribadi masing-masing.",
  },
  {
    title: "RSVP otomatis",
    description:
      "Tamu mengisi kehadiran langsung dari undangan, dan jawabannya langsung terlihat di dashboard.",
  },
  {
    title: "Pantau semuanya dari dashboard",
    description: "Kelola acara, tamu, dan undangan digitalmu dari satu dashboard yang sama.",
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
            <li key={benefit.title} className="rounded-lg border p-5">
              <p className="font-medium">{benefit.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{benefit.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
