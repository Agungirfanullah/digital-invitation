import type { ReactNode } from "react";

import { CheckIcon, QrCodeIcon } from "@/components/marketing/icons";

/**
 * Small, honest illustrations of already-shipped dashboard/public features,
 * used by the Homepage feature grid (docs/PRD.md §8 items 6-9). Every label
 * here is the product's own real copy (RSVP status labels from
 * `lib/rsvp/labels.ts`, check-in labels from `lib/checkin/labels.ts`, save
 * states from `components/editor/save-status.tsx`, the WhatsApp message
 * structure from `lib/invitation-delivery/message.ts`) — never an invented
 * statistic. Guest "names" are plain skeleton bars or obvious samples, and
 * the analytics mockup shows decorative bar heights with no invented
 * view/RSVP counts — see CLAUDE.md §1.4/§1.5 on fake data/metrics.
 */

function MockupCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-card border-border/70 w-full rounded-2xl border p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return <span className={`bg-muted block rounded-full ${className}`} />;
}

export function GuestListMockup() {
  const rows = [
    {
      initial: "D",
      status: "Hadir",
      statusClass: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
    },
    {
      initial: "R",
      status: "Belum Pasti",
      statusClass: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
    },
    {
      initial: "K",
      status: "Belum Mengisi RSVP",
      statusClass: "bg-secondary text-secondary-foreground border border-border/50",
    },
  ];

  return (
    <MockupCard>
      <div className="border-border/50 mb-4 flex items-center justify-between border-b pb-3">
        <p className="text-foreground text-sm font-semibold tracking-tight">Daftar Tamu</p>
        <span className="text-primary bg-primary/10 border-primary/20 rounded-full border px-2.5 py-1 text-xs font-semibold">
          Impor CSV
        </span>
      </div>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.initial} className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {row.initial}
            </span>
            <SkeletonBar className="h-2.5 flex-1" />
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${row.statusClass}`}
            >
              {row.status}
            </span>
          </li>
        ))}
      </ul>
    </MockupCard>
  );
}

export function RsvpMockup() {
  const options = [
    { label: "Ya, saya akan hadir", selected: true },
    { label: "Maaf, saya tidak dapat hadir", selected: false },
    { label: "Masih belum pasti", selected: false },
  ];

  return (
    <MockupCard>
      <p className="text-foreground text-sm font-semibold tracking-tight">
        Apakah kamu bisa hadir?
      </p>
      <ul className="mt-3 space-y-2">
        {options.map((option) => (
          <li
            key={option.label}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm ${
              option.selected
                ? "border-primary bg-primary/10 text-foreground font-medium"
                : "border-border/60 text-muted-foreground"
            }`}
          >
            <span
              className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                option.selected ? "border-primary" : "border-muted-foreground/40"
              }`}
            >
              {option.selected && <span className="bg-primary size-2 rounded-full" />}
            </span>
            {option.label}
          </li>
        ))}
      </ul>
      <span className="bg-primary text-primary-foreground mt-4 block rounded-xl py-2.5 text-center text-sm font-semibold">
        Kirim RSVP
      </span>
    </MockupCard>
  );
}

export function WhatsAppMockup() {
  return (
    <MockupCard className="bg-[#efeae2] p-4">
      <div className="ml-auto max-w-[92%] rounded-2xl rounded-tr-sm bg-[#d9fdd3] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#111b21] shadow-xs">
        <p>Halo Bapak Rudi,</p>
        <p className="mt-1.5">
          Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir di Pernikahan Ayu & Budi.
        </p>
        <p className="mt-1.5 truncate text-[#027eb5] underline">undangan.id/invite/ayu-budi?to=…</p>
        <p className="mt-1 text-right text-[10px] text-[#667781]">09.41 ✓✓</p>
      </div>
    </MockupCard>
  );
}

export function CheckInMockup() {
  return (
    <MockupCard className="flex items-center gap-4">
      <div className="bg-foreground relative flex size-20 shrink-0 items-center justify-center rounded-2xl text-white">
        <QrCodeIcon className="size-11" />
        <span className="absolute inset-x-2 top-1/2 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_12px_2px] shadow-emerald-400/70" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
          <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckIcon className="size-3" />
          </span>
          Berhasil check-in
        </p>
        <SkeletonBar className="mt-2.5 h-2.5 w-32" />
        <SkeletonBar className="mt-2 h-2 w-20" />
        <p className="text-muted-foreground mt-2.5 text-xs">
          Tamu yang sama tidak bisa masuk dua kali.
        </p>
      </div>
    </MockupCard>
  );
}

export function GiftMockup() {
  return (
    <MockupCard>
      <p className="text-foreground text-sm font-semibold tracking-tight">Amplop Digital</p>
      <ul className="mt-3 space-y-2.5">
        <li className="border-border/70 bg-background/60 flex items-center justify-between rounded-xl border px-3.5 py-2.5">
          <div>
            <p className="text-foreground text-xs font-semibold">Transfer Bank</p>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">•••• •••• 1234</p>
          </div>
          <span className="text-primary bg-primary/10 border-primary/20 rounded-md border px-2.5 py-1 text-xs font-semibold">
            Salin
          </span>
        </li>
        <li className="border-border/70 bg-background/60 flex items-center justify-between rounded-xl border px-3.5 py-2.5">
          <div>
            <p className="text-foreground text-xs font-semibold">E-Wallet</p>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">•••• •••• 5678</p>
          </div>
          <span className="text-primary bg-primary/10 border-primary/20 rounded-md border px-2.5 py-1 text-xs font-semibold">
            Salin
          </span>
        </li>
      </ul>
    </MockupCard>
  );
}

export function AnalyticsMockup() {
  const bars = [40, 65, 50, 80, 60, 90, 70];
  const stats = ["Tayangan", "RSVP", "Check-in"];

  return (
    <MockupCard>
      <p className="text-foreground text-sm font-semibold tracking-tight">Analitik Undangan</p>
      <div className="border-border/50 mt-4 flex h-20 items-end gap-2 border-b pb-2">
        {bars.map((height, index) => (
          <span
            key={index}
            className="from-primary flex-1 rounded-t-md bg-gradient-to-t to-emerald-400/80"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <li key={stat} className="space-y-1.5">
            <SkeletonBar className="h-3.5 w-10" />
            <p className="text-muted-foreground text-xs">{stat}</p>
          </li>
        ))}
      </ul>
    </MockupCard>
  );
}

export function EditorMockup() {
  return (
    <MockupCard className="p-0">
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckIcon className="size-3" />
          Tersimpan
        </span>
      </div>
      <div className="grid grid-cols-5 gap-3 p-4">
        <div className="col-span-3 space-y-2.5">
          {["Mempelai", "Jadwal Acara", "Galeri", "Tema"].map((label, index) => (
            <span
              key={label}
              className={`block rounded-lg px-3 py-2 text-xs font-medium ${
                index === 1 ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="border-border/60 col-span-2 flex flex-col items-center justify-center rounded-xl border bg-[#121110] p-2 text-center">
          <span className="text-[8px] tracking-[0.3em] text-[#c9a96e] uppercase">Pernikahan</span>
          <span className="mt-1 font-serif text-sm text-[#f5efe0]">Ayu & Budi</span>
          <span className="mt-1.5 h-px w-8 bg-[#c9a96e]/60" />
        </div>
      </div>
    </MockupCard>
  );
}
