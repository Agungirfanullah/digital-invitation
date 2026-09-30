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
  },
  {
    title: "Isi detail acara",
    description: "Jawab beberapa pertanyaan singkat: jenis acara, nama, tanggal, dan template.",
  },
  {
    title: "Lengkapi di editor",
    description: "Sempurnakan undangan — jadwal, galeri, tamu, dan lainnya — di editor undanganmu.",
  },
  {
    title: "Publikasikan & bagikan",
    description: "Publikasikan saat sudah siap, lalu bagikan tautannya ke tamu melalui WhatsApp.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2
          id="how-it-works-heading"
          className="text-center text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Cara Kerjanya
        </h2>
        <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="bg-background rounded-lg border p-5">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Langkah {index + 1}
              </p>
              <p className="mt-1 font-medium">{step.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
