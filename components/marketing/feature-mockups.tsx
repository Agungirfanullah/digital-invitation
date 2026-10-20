/**
 * Small, honest illustrations of four already-shipped dashboard/public
 * features, used by the Homepage's `FeatureSection`s (docs/PRD.md §8
 * items 6-9). Every label here is the product's own real copy (RSVP
 * status labels from `lib/rsvp/labels.ts`, gift method labels from
 * `lib/gifts/labels.ts`) — never an invented statistic. Guest "names" are
 * plain skeleton bars, not fabricated people, and the analytics mockup
 * shows decorative bar heights with no invented view/RSVP counts — see
 * CLAUDE.md §1.4/§1.5 on fake data/metrics.
 */

function MockupCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card/90 mx-auto w-full max-w-sm rounded-2xl border border-border/70 p-6 shadow-md backdrop-blur-xs transition-shadow hover:shadow-lg">
      {children}
    </div>
  );
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return <span className={`bg-muted/80 block rounded-full ${className}`} aria-hidden />;
}

export function GuestListMockup() {
  const rows = [
    { initial: "D", status: "Hadir", statusClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" },
    { initial: "R", status: "Belum Pasti", statusClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20" },
    {
      initial: "K",
      status: "Belum Mengisi RSVP",
      statusClass: "bg-secondary text-secondary-foreground border border-border/50",
    },
  ];

  return (
    <MockupCard>
      <div className="mb-5 flex items-center justify-between border-b border-border/40 pb-3">
        <p className="text-sm font-semibold tracking-tight text-foreground">Daftar Tamu Undangan</p>
        <span className="text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1 text-xs font-semibold">
          Impor CSV
        </span>
      </div>
      <ul className="space-y-3.5">
        {rows.map((row) => (
          <li key={row.initial} className="flex items-center gap-3">
            <span className="bg-primary/10 text-primary border border-primary/20 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
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
      <p className="text-sm font-semibold tracking-tight text-foreground">Apakah kamu bisa hadir?</p>
      <ul className="mt-4 space-y-2.5">
        {options.map((option) => (
          <li
            key={option.label}
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
              option.selected ? "border-primary bg-primary/10 font-medium text-foreground" : "border-border/60 hover:bg-muted/40"
            }`}
          >
            <span
              className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                option.selected ? "border-primary" : "border-muted-foreground/40"
              }`}
              aria-hidden
            >
              {option.selected && <span className="bg-primary size-2 rounded-full" />}
            </span>
            {option.label}
          </li>
        ))}
      </ul>
      <span className="bg-primary text-primary-foreground mt-5 block rounded-xl py-2.5 text-center text-sm font-semibold shadow-xs hover:opacity-95 cursor-default">
        Kirim RSVP
      </span>
    </MockupCard>
  );
}

export function GiftMockup() {
  return (
    <MockupCard>
      <p className="text-sm font-semibold tracking-tight text-foreground">Hadiah Digital & Amplop</p>
      <ul className="mt-4 space-y-3">
        <li className="flex items-center justify-between rounded-xl border border-border/70 bg-background/50 px-3.5 py-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Transfer Bank BCA</p>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">•••• •••• 1234</p>
          </div>
          <span className="text-primary bg-primary/10 border border-primary/20 rounded-md px-2.5 py-1 text-xs font-semibold cursor-default">
            Salin
          </span>
        </li>
        <li className="flex items-center justify-between rounded-xl border border-border/70 bg-background/50 px-3.5 py-3">
          <div>
            <p className="text-xs font-semibold text-foreground">QRIS / Pembayaran QR</p>
            <p className="text-muted-foreground mt-0.5 text-xs">Scan via mobile banking</p>
          </div>
          <span className="bg-muted border border-border/50 size-9 rounded-md flex items-center justify-center text-muted-foreground text-[10px]" aria-hidden>
            QR
          </span>
        </li>
      </ul>
    </MockupCard>
  );
}

export function AnalyticsMockup() {
  const bars = [40, 65, 50, 80, 60, 90, 70];
  const stats = ["Dilihat", "RSVP Masuk", "Checked-in"];

  return (
    <MockupCard>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold tracking-tight text-foreground">Analitik Undangan</p>
        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          Real-time
        </span>
      </div>
      <div className="mt-5 flex h-24 items-end gap-2 border-b border-border/40 pb-2" aria-hidden>
        {bars.map((height, index) => (
          <span
            key={index}
            className="bg-primary/80 hover:bg-primary flex-1 rounded-t-md transition-all"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <li key={stat} className="space-y-1.5">
            <SkeletonBar className="h-4 w-10" />
            <p className="text-muted-foreground text-xs">{stat}</p>
          </li>
        ))}
      </ul>
    </MockupCard>
  );
}
