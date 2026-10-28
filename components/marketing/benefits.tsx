import type { ComponentType, ReactNode } from "react";

import {
  AnalyticsMockup,
  CheckInMockup,
  EditorMockup,
  GiftMockup,
  GuestListMockup,
  RsvpMockup,
  WhatsAppMockup,
} from "@/components/marketing/feature-mockups";
import {
  CalendarCheckIcon,
  ChartBarIcon,
  PencilIcon,
  QrCodeIcon,
  SendIcon,
  ShieldIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/marketing/icons";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";

interface Feature {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  visual?: ReactNode;
  /** Wide tiles span two columns; their mockup keeps a readable width. */
  wide?: boolean;
  /** Grid spans; chosen so the md (2-column) and lg (3-column) grids have no gaps. */
  span?: string;
}

/** Each tile describes an already-shipped capability (docs/PRD.md §8 items 3, 6-9, D-073). */
const FEATURES: Feature[] = [
  {
    title: "Kelola tamu tanpa ribet",
    description:
      "Tambah tamu satu per satu atau impor dari CSV dengan pratinjau, validasi, dan deteksi duplikat sebelum disimpan.",
    icon: UsersIcon,
    visual: <GuestListMockup />,
    wide: true,
    span: "md:col-span-2",
  },
  {
    title: "RSVP dari undangan",
    description: "Tamu mengonfirmasi kehadiran langsung dari tautan pribadinya.",
    icon: CalendarCheckIcon,
    visual: <RsvpMockup />,
  },
  {
    title: "Kirim personal via WhatsApp",
    description: "Pesan berisi nama dan tautan pribadi tiap tamu, siap dikirim sekali ketuk.",
    icon: SendIcon,
    visual: <WhatsAppMockup />,
  },
  {
    title: "Check-in QR di hari-H",
    description:
      "Panitia memindai QR tamu di lokasi dan langsung tahu siapa yang sudah datang, tanpa daftar hadir kertas.",
    icon: QrCodeIcon,
    visual: <CheckInMockup />,
    wide: true,
    span: "md:col-span-2",
  },
  {
    title: "Amplop digital",
    description: "Tampilkan rekening atau e-wallet, tamu tinggal salin.",
    icon: WalletIcon,
    visual: <GiftMockup />,
  },
  {
    title: "Analitik undangan",
    description: "Lihat berapa kali undanganmu dibuka, RSVP masuk, dan tamu yang check-in.",
    icon: ChartBarIcon,
    visual: <AnalyticsMockup />,
  },
  {
    title: "Editor dengan pratinjau langsung",
    description: "Setiap perubahan langsung terlihat dan tersimpan otomatis.",
    icon: PencilIcon,
    visual: <EditorMockup />,
    span: "md:col-span-2 lg:col-span-1",
  },
];

/** Homepage feature grid (docs/PRD.md §8 items 3 and 6-9, D-073). */
export function Benefits() {
  return (
    <section
      id="fitur"
      aria-labelledby="benefits-heading"
      className="bg-muted/40 relative overflow-hidden px-5 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-primary text-sm font-semibold">Fitur lengkap</p>
          <h2
            id="benefits-heading"
            className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl"
          >
            Semua yang Kamu Butuhkan untuk{" "}
            <span className="from-primary text-gradient bg-gradient-to-r to-emerald-500">
              Undangan Digital
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg">
            Dari menyusun daftar tamu sampai menyambut mereka di pintu masuk, semuanya ada di satu
            tempat.
          </p>
        </ScrollReveal>

        {/* A swipeable row on phones, a grid from md up. */}
        <ul className="no-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:mt-14 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <ScrollReveal
              key={feature.title}
              as="li"
              delay={(index % 3) * 90}
              className={`w-[85%] shrink-0 snap-start md:w-auto ${feature.span ?? ""}`}
            >
              <FeatureTile feature={feature} />
            </ScrollReveal>
          ))}
          <ScrollReveal
            as="li"
            delay={180}
            className="w-[85%] shrink-0 snap-start md:col-span-2 md:w-auto lg:col-span-3"
          >
            <PrivacyTile />
          </ScrollReveal>
        </ul>
      </div>
    </section>
  );
}

function FeatureTile({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <article className="group border-border/60 bg-card hover:border-primary/30 flex h-full flex-col gap-6 overflow-hidden rounded-3xl border p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7">
      <div>
        <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110">
          <Icon className="size-5" />
        </span>
        <h3 className="text-foreground mt-5 text-lg font-bold tracking-tight">{feature.title}</h3>
        <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
          {feature.description}
        </p>
      </div>
      {feature.visual && (
        <div className="bg-muted/50 mt-auto flex justify-center rounded-2xl p-4 transition-transform duration-500 group-hover:scale-[1.02]">
          <div className={`w-full ${feature.wide ? "max-w-md" : ""}`}>{feature.visual}</div>
        </div>
      )}
    </article>
  );
}

/** Customer invitations are kept out of search engines (D-094) and guest links are random (CLAUDE.md §7.2). */
function PrivacyTile() {
  return (
    <article className="from-primary relative flex h-full flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br to-emerald-800 p-7 text-white shadow-lg sm:p-9">
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true"
      />
      <span className="flex size-11 items-center justify-center rounded-xl bg-white/15">
        <ShieldIcon className="size-5" />
      </span>
      <h3 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">Privat sejak awal</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
        Undanganmu tidak muncul di Google dan hanya bisa dibuka lewat tautannya. Tautan setiap tamu
        acak dan tidak bisa ditebak, jadi RSVP dan ucapan hanya datang dari tamu yang kamu undang.
      </p>
    </article>
  );
}
