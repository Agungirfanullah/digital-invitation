import type { Metadata } from "next";
import Link from "next/link";

import { requireAppUser } from "@/lib/auth/session";
import { listEventsWithStatsForUser } from "@/lib/events/service";
import { Button } from "@/components/ui/button";
import { EventRow } from "@/components/dashboard/event-row";

export const metadata: Metadata = {
  title: "Dashboard — Digital Invitation",
};

const RECENT_LIMIT = 3;

function ActionIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-9 shrink-0"
    >
      {children}
    </svg>
  );
}

export default async function DashboardPage() {
  const user = await requireAppUser();
  const events = await listEventsWithStatsForUser(user.id);

  const totalGuests = events.reduce((sum, event) => sum + event.stats.guests, 0);
  const totalAttending = events.reduce((sum, event) => sum + event.stats.attendingPeople, 0);
  const recent = events.slice(0, RECENT_LIMIT);
  const latest = events[0];

  const tiles = [
    { label: "Undangan", value: events.length },
    { label: "Total Tamu", value: totalGuests },
    { label: "Akan Hadir", value: totalAttending },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Beranda</h1>

      <section aria-label="Ringkasan" className="bg-card space-y-4 rounded-xl border p-4 shadow-sm">
        <dl className="grid grid-cols-3 gap-3">
          {tiles.map((tile) => (
            <div key={tile.label} className="bg-secondary/60 rounded-lg px-4 py-3">
              <dt className="text-muted-foreground text-xs">{tile.label}</dt>
              <dd className="text-primary mt-0.5 text-2xl font-semibold tabular-nums">
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>

        <Link
          href="/dashboard/events/new"
          className="from-primary to-primary/80 text-primary-foreground focus-visible:ring-ring flex items-center gap-4 rounded-xl bg-gradient-to-r px-5 py-4 transition-opacity outline-none hover:opacity-95 focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <ActionIcon>
            <rect x="3.5" y="7" width="17" height="12.5" rx="2" />
            <path d="m4 9 8 5.5L20 9M12 3.5v3M9.5 5h5" />
          </ActionIcon>
          <span>
            <span className="block text-lg font-semibold">Buat Undangan Baru</span>
            <span className="block text-sm opacity-90">
              Buat undangan untuk pernikahan atau acaramu.
            </span>
          </span>
        </Link>

        {latest && (
          <Link
            href={`/dashboard/events/${latest.id}/check-in`}
            className="bg-foreground text-background focus-visible:ring-ring flex items-center gap-4 rounded-xl px-5 py-4 transition-opacity outline-none hover:opacity-95 focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <ActionIcon>
              <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
              <path d="M14.5 14.5h3v3h-3zM19.5 14.5h1v1h-1zM14.5 19.5h1v1h-1zM19.5 19.5h1v1h-1z" />
            </ActionIcon>
            <span className="min-w-0">
              <span className="block text-lg font-semibold">Check-in Tamu</span>
              <span className="block truncate text-sm opacity-80">
                Scan QR tamu saat hari-H · {latest.title}
              </span>
            </span>
          </Link>
        )}
      </section>

      <section aria-labelledby="my-invitations-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="my-invitations-heading" className="text-lg font-semibold tracking-tight">
              Undangan milikmu
            </h2>
            <p className="text-muted-foreground text-sm">Undangan yang pernah kamu buat.</p>
          </div>
          {events.length > 0 && (
            <Link
              href="/dashboard/events"
              className="text-primary shrink-0 text-sm font-medium underline-offset-4 hover:underline"
            >
              Selengkapnya »
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">Belum ada acara.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Mulai dengan membuat acara pertamamu.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/events/new">Buat Acara</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {recent.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
