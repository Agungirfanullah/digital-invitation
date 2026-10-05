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
    <div className="bg-card mx-auto w-full max-w-sm rounded-xl border p-5 shadow-sm">
      {children}
    </div>
  );
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return <span className={`bg-muted block rounded-full ${className}`} aria-hidden />;
}

export function GuestListMockup() {
  const rows = [
    { initial: "D", status: "Hadir", statusClass: "bg-green-100 text-green-800" },
    { initial: "R", status: "Belum Pasti", statusClass: "bg-amber-100 text-amber-800" },
    {
      initial: "K",
      status: "Belum Mengisi RSVP",
      statusClass: "bg-secondary text-secondary-foreground",
    },
  ];

  return (
    <MockupCard>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium">Daftar Tamu</p>
        <span className="text-primary bg-primary/10 rounded-full px-2.5 py-1 text-xs font-medium">
          Impor CSV
        </span>
      </div>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.initial} className="flex items-center gap-3">
            <span className="bg-secondary text-secondary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
              {row.initial}
            </span>
            <SkeletonBar className="h-2.5 flex-1" />
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${row.statusClass}`}
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
      <p className="text-sm font-medium">Apakah kamu bisa hadir?</p>
      <ul className="mt-3 space-y-2">
        {options.map((option) => (
          <li
            key={option.label}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              option.selected ? "border-primary bg-primary/5" : ""
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
      <span className="bg-primary text-primary-foreground mt-4 block rounded-md py-2 text-center text-sm font-medium">
        Kirim RSVP
      </span>
    </MockupCard>
  );
}

export function GiftMockup() {
  return (
    <MockupCard>
      <p className="text-sm font-medium">Hadiah Digital</p>
      <ul className="mt-3 space-y-3">
        <li className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <div>
            <p className="text-xs font-medium">Transfer Bank</p>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs">•••• •••• 1234</p>
          </div>
          <span className="text-primary bg-primary/10 rounded-md px-2 py-1 text-xs font-medium">
            Salin
          </span>
        </li>
        <li className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <p className="text-xs font-medium">QRIS / Kode QR</p>
          <span className="bg-muted size-9 rounded-md" aria-hidden />
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
      <p className="text-sm font-medium">Analitik Undangan</p>
      <div className="mt-4 flex h-20 items-end gap-2" aria-hidden>
        {bars.map((height, index) => (
          <span
            key={index}
            className="bg-primary/70 flex-1 rounded-t-sm"
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
