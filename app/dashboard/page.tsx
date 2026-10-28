import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { requireAppUser } from "@/lib/auth/session";
import { listEventsWithStatsForUser } from "@/lib/events/service";
import { Button } from "@/components/ui/button";
import { EVENT_ICONS, NAV_ICONS } from "@/components/dashboard/dashboard-icons";
import { EventRow } from "@/components/dashboard/event-row";

export const metadata: Metadata = {
  title: "Dashboard",
};

const RECENT_LIMIT = 4;

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export default async function DashboardPage() {
  const user = await requireAppUser();
  const events = await listEventsWithStatsForUser(user.id);

  const totalGuests = events.reduce((sum, event) => sum + event.stats.guests, 0);
  const totalAttending = events.reduce((sum, event) => sum + event.stats.attendingPeople, 0);
  const recent = events.slice(0, RECENT_LIMIT);
  const latest = events[0];

  // Every number here is counted from the owner's real events (CLAUDE.md §14).
  const tiles = [
    { label: "Undangan", value: events.length, icon: NAV_ICONS.invitations },
    { label: "Total Tamu", value: totalGuests, icon: EVENT_ICONS.guests },
    { label: "Akan Hadir", value: totalAttending, icon: EVENT_ICONS.rsvp },
  ];

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{today}</p>
          <h1 className="text-foreground mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Halo, {firstName(user.name)}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Kelola undangan dan pantau tamu acaramu dari sini.
          </p>
        </div>
        <Button asChild className="rounded-full px-5 font-semibold shadow-sm">
          <Link href="/dashboard/events/new">+ Buat Undangan Baru</Link>
        </Button>
      </header>

      <section aria-label="Ringkasan">
        <dl className="grid grid-cols-3 gap-3 sm:gap-4">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="border-border/60 bg-card rounded-2xl border p-4 shadow-xs sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground text-xs font-medium sm:text-sm">
                  {tile.label}
                </dt>
                <span className="bg-primary/10 text-primary hidden size-9 items-center justify-center rounded-xl sm:flex">
                  <span className="size-[18px]">{tile.icon}</span>
                </span>
              </div>
              <dd className="text-foreground mt-2 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">
                {tile.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {latest && (
        <section
          aria-labelledby="latest-heading"
          className="from-primary relative isolate overflow-hidden rounded-3xl bg-gradient-to-br to-emerald-800 p-6 text-white shadow-lg sm:p-8"
        >
          <div
            className="pointer-events-none absolute -top-20 -right-16 -z-10 size-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold tracking-wider text-emerald-200 uppercase">
            Undangan terbaru
          </p>
          <h2 id="latest-heading" className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            {latest.title}
          </h2>
          <p className="mt-1 text-sm text-white/75">
            {latest.stats.guests} tamu · {latest.stats.attendingPeople} akan hadir ·{" "}
            {latest.stats.wishes} ucapan
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <QuickLink href={`/dashboard/events/${latest.id}`} icon={NAV_ICONS.overview}>
              Ringkasan acara
            </QuickLink>
            <QuickLink href={`/dashboard/events/${latest.id}/guests`} icon={EVENT_ICONS.guests}>
              Daftar tamu
            </QuickLink>
            <QuickLink href={`/dashboard/events/${latest.id}/check-in`} icon={EVENT_ICONS.checkIn}>
              Check-in Tamu
            </QuickLink>
          </div>
        </section>
      )}

      <section aria-labelledby="my-invitations-heading" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2
            id="my-invitations-heading"
            className="text-foreground text-lg font-bold tracking-tight"
          >
            Undangan milikmu
          </h2>
          {events.length > 0 && (
            <Link
              href="/dashboard/events"
              className="text-primary shrink-0 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Lihat semua
            </Link>
          )}
        </div>

        {events.length === 0 ? (
          <div className="border-border/70 bg-card/50 rounded-3xl border-2 border-dashed px-6 py-14 text-center">
            <div className="bg-primary/10 text-primary mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl">
              <span className="size-7">{NAV_ICONS.invitations}</span>
            </div>
            <p className="text-foreground text-lg font-bold">Belum ada acara.</p>
            <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm">
              Mulai dengan membuat acara pertamamu, pilih template, lalu bagikan ke orang terdekat.
            </p>
            <Button asChild className="mt-6 rounded-full px-6 font-semibold shadow-sm">
              <Link href="/dashboard/events/new">Buat Acara</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {recent.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
    >
      <span className="size-4">{icon}</span>
      {children}
    </Link>
  );
}
