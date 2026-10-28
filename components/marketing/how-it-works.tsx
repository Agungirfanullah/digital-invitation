import { PencilIcon, SendIcon, SparklesIcon, UserPlusIcon } from "@/components/marketing/icons";
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
    description: "Buat akun gratis dengan email.",
    icon: UserPlusIcon,
  },
  {
    title: "Isi detail acara",
    description: "Jawab beberapa pertanyaan singkat: jenis acara, nama, tanggal, dan template.",
    icon: SparklesIcon,
  },
  {
    title: "Lengkapi di editor",
    description: "Tambahkan jadwal, foto, galeri, dan tamu, lalu atur bagian undangan sesukamu.",
    icon: PencilIcon,
  },
  {
    title: "Publikasikan & bagikan",
    description: "Publikasikan saat sudah siap, lalu kirim tautan pribadi ke setiap tamu.",
    icon: SendIcon,
  },
];

export function HowItWorks() {
  return (
    <section
      id="cara-kerja"
      aria-labelledby="how-it-works-heading"
      className="relative overflow-hidden px-5 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-primary text-sm font-semibold">Empat langkah</p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Cara Kerjanya
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            Dari pendaftaran sampai undangan siap dibagikan ke keluarga dan teman.
          </p>
        </ScrollReveal>

        <div className="relative mt-14">
          <span
            className="via-primary/40 absolute top-7 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-transparent to-transparent lg:block"
            aria-hidden="true"
          />
          <ol className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.title} as="li" delay={index * 120} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <span className="border-border bg-card text-primary relative flex size-14 items-center justify-center rounded-2xl border shadow-sm">
                      <Icon className="size-6" />
                      <span className="bg-foreground text-background absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full text-[11px] font-bold">
                        {index + 1}
                      </span>
                    </span>
                    <h3 className="text-foreground mt-5 text-base font-bold tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 max-w-[16rem] text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
