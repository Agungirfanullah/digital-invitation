import type { Metadata } from "next";
import Link from "next/link";

import { requireAppUser } from "@/lib/auth/session";
import { listEventsWithStatsForUser } from "@/lib/events/service";
import { Button } from "@/components/ui/button";
import { EventRow } from "@/components/dashboard/event-row";

export const metadata: Metadata = {
  title: "Dashboard",
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
    { label: "Undangan", value: events.length, icon: "💌" },
    { label: "Total Tamu", value: totalGuests, icon: "👥" },
    { label: "Akan Hadir", value: totalAttending, icon: "✨" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header with Greeting */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">Beranda</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Selamat datang kembali,{" "}
            <span className="text-foreground font-semibold">{user.name}</span>! Kelola undangan dan
            pantau tamu acaramu.
          </p>
        </div>
        <div className="text-muted-foreground bg-muted/60 border-border/50 mt-2 w-fit rounded-full border px-3 py-1.5 text-xs font-medium sm:mt-0">
          📅{" "}
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <section aria-label="Ringkasan" className="space-y-4">
        {/* Metric tiles */}
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="bg-card border-border/70 hover:border-primary/30 rounded-2xl border p-5 shadow-xs transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {tile.label}
                </dt>
                <span className="text-lg">{tile.icon}</span>
              </div>
              <dd className="text-primary mt-3 text-3xl font-extrabold tracking-tight tabular-nums">
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Quick action banners */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/events/new"
            className="from-primary via-primary/95 to-primary/85 text-primary-foreground focus-visible:ring-ring flex items-center gap-4 rounded-2xl bg-gradient-to-r p-5 shadow-md transition-all duration-200 outline-none hover:scale-[1.01] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <div className="text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ActionIcon>
                <rect x="3.5" y="7" width="17" height="12.5" rx="2" />
                <path d="m4 9 8 5.5L20 9M12 3.5v3M9.5 5h5" />
              </ActionIcon>
            </div>
            <div>
              <span className="block text-base font-bold tracking-tight">Buat Undangan Baru</span>
              <span className="mt-0.5 block text-xs opacity-90">
                Buat undangan pernikahan atau acaramu dalam hitungan menit.
              </span>
            </div>
          </Link>

          {latest && (
            <Link
              href={`/dashboard/events/${latest.id}/check-in`}
              className="bg-foreground text-background focus-visible:ring-ring flex items-center gap-4 rounded-2xl p-5 shadow-md transition-all duration-200 outline-none hover:scale-[1.01] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <div className="text-background flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <ActionIcon>
                  <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
                  <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
                  <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
                  <path d="M14.5 14.5h3v3h-3zM19.5 14.5h1v1h-1zM14.5 19.5h1v1h-1zM19.5 19.5h1v1h-1z" />
                </ActionIcon>
              </div>
              <div className="min-w-0">
                <span className="block text-base font-bold tracking-tight">Check-in Tamu</span>
                <span className="mt-0.5 block truncate text-xs opacity-80">
                  Scan QR tamu saat hari-H · {latest.title}
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Recent invitations section */}
      <section aria-labelledby="my-invitations-heading" className="space-y-4">
        <div className="border-border/50 flex items-end justify-between gap-4 border-b pb-3">
          <div>
            <h2
              id="my-invitations-heading"
              className="text-foreground text-lg font-bold tracking-tight"
            >
              Undangan milikmu
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Undangan yang pernah kamu buat.
            </p>
          </div>
          {events.length > 0 && (
            <Link
              href="/dashboard/events"
              className="text-primary shrink-0 text-xs font-semibold underline-offset-4 hover:underline sm:text-sm"
            >
              Selengkapnya »
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="border-border/70 bg-card/40 mt-4 rounded-2xl border-2 border-dashed p-10 text-center">
            <div className="bg-primary/10 text-primary mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
              💌
            </div>
            <p className="text-foreground font-semibold">Belum ada acara.</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              Mulai dengan membuat acara pertamamu dan bagikan ke orang terdekat.
            </p>
            <Button asChild className="mt-5 font-semibold shadow-xs">
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
