import type { ReactNode } from "react";
import Link from "next/link";

import { EVENT_ICONS as ICONS } from "@/components/dashboard/dashboard-icons";

interface MenuItem {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
  /** Icon tile colors; each tool gets its own so the grid scans at a glance. */
  tone: string;
}

const ARROW = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="size-4"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/**
 * The event hub's tools, grouped by what the owner is doing: preparing the
 * invitation, then looking after guests. Descriptions say what each page is
 * for, so a first-time owner knows where to go without opening each one.
 * Cards fade in one after another (skipped under reduced motion).
 */
export function EventMenuGrid({ eventId }: { eventId: string }) {
  const base = `/dashboard/events/${eventId}`;

  const guestTools: MenuItem[] = [
    {
      href: `${base}/guests`,
      label: "Tamu",
      description: "Daftar tamu, kuota kursi, dan tautan undangan pribadi.",
      icon: ICONS.guests,
      tone: "bg-sky-500/10 text-sky-700",
    },
    {
      href: `${base}/rsvp`,
      label: "RSVP",
      description: "Pantau siapa yang hadir dan jumlah tamunya.",
      icon: ICONS.rsvp,
      tone: "bg-emerald-500/10 text-emerald-700",
    },
    {
      href: `${base}/check-in`,
      label: "Check-in",
      description: "Pindai QR tamu di pintu masuk saat acara.",
      icon: ICONS.checkIn,
      tone: "bg-violet-500/10 text-violet-700",
    },
    {
      href: `${base}/wishes`,
      label: "Ucapan",
      description: "Baca dan setujui ucapan dari tamu.",
      icon: ICONS.wishes,
      tone: "bg-rose-500/10 text-rose-700",
    },
    {
      href: `${base}/gifts`,
      label: "Hadiah",
      description: "Rekening dan alamat untuk amplop digital.",
      icon: ICONS.gifts,
      tone: "bg-amber-500/10 text-amber-700",
    },
    {
      href: `${base}/analytics`,
      label: "Analitik",
      description: "Kunjungan undangan dan respons tamu.",
      icon: ICONS.analytics,
      tone: "bg-teal-500/10 text-teal-700",
    },
  ];

  return (
    <div className="space-y-7">
      <section aria-labelledby="menu-prepare" className="space-y-3">
        <h2
          id="menu-prepare"
          className="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
        >
          Siapkan undangan
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="animate-fade-in-up sm:col-span-2">
            <Link
              href={`${base}/editor`}
              className="group focus-visible:ring-ring relative isolate flex h-full min-h-40 flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950 p-5 text-white shadow-md transition-all duration-300 outline-none hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2 sm:p-6"
            >
              <EditorArt />
              <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                <span className="size-5">{ICONS.editor}</span>
              </span>
              <span className="max-w-xs">
                <span className="block text-lg font-semibold tracking-tight">Editor Undangan</span>
                <span className="mt-1 block text-sm text-white/70">
                  Atur isi, foto, tema, dan urutan bagian undanganmu.
                </span>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-900 transition-colors group-hover:bg-emerald-100">
                  Buka editor
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                    {ARROW}
                  </span>
                </span>
              </span>
            </Link>
          </li>
          <MenuCard
            index={1}
            item={{
              href: `${base}/edit`,
              label: "Edit Acara",
              description: "Judul, jenis acara, alamat tautan, dan deskripsi.",
              icon: ICONS.settings,
              tone: "bg-zinc-500/10 text-zinc-700",
            }}
          />
        </ul>
      </section>

      <section aria-labelledby="menu-guests" className="space-y-3">
        <h2
          id="menu-guests"
          className="text-muted-foreground text-xs font-semibold tracking-wider uppercase"
        >
          Tamu &amp; interaksi
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {guestTools.map((item, index) => (
            <MenuCard key={item.href} item={item} index={index + 2} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  return (
    <li className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
      <Link
        href={item.href}
        className="group focus-visible:ring-ring border-border/60 bg-card hover:border-primary/30 relative flex h-full flex-col gap-3 rounded-2xl border p-4 shadow-xs transition-all duration-300 outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 sm:p-5"
      >
        <span className="flex items-start justify-between gap-2">
          <span
            className={`flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${item.tone}`}
          >
            <span className="size-5">{item.icon}</span>
          </span>
          <span className="text-muted-foreground/0 group-hover:text-primary -translate-x-1 transition-all duration-300 group-hover:translate-x-0">
            {ARROW}
          </span>
        </span>
        <span>
          <span className="text-foreground block text-sm font-semibold">{item.label}</span>
          <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
            {item.description}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Decorative stacked "invitation cards" in the editor card's corner. */
function EditorArt() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <span className="absolute -top-16 -right-10 size-56 rounded-full bg-emerald-500/20 blur-3xl" />
      <span className="absolute top-6 right-6 hidden h-32 w-24 rotate-6 rounded-xl border border-white/10 bg-white/5 transition-transform duration-500 group-hover:rotate-12 sm:block" />
      <span className="absolute top-8 right-12 hidden h-32 w-24 -rotate-3 rounded-xl border border-white/15 bg-white/10 p-3 transition-transform duration-500 group-hover:-rotate-6 sm:block">
        <span className="mx-auto block h-1.5 w-10 rounded-full bg-white/40" />
        <span className="mx-auto mt-3 block size-8 rounded-full bg-white/20" />
        <span className="mx-auto mt-3 block h-1 w-14 rounded-full bg-white/30" />
        <span className="mx-auto mt-1.5 block h-1 w-10 rounded-full bg-white/20" />
      </span>
    </span>
  );
}
