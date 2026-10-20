import type { Metadata } from "next";
import Link from "next/link";

import { requireAppUser } from "@/lib/auth/session";
import { listEventsForUser } from "@/lib/events/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventRow } from "@/components/dashboard/event-row";

export const metadata: Metadata = {
  title: "Undangan — Digital Invitation",
};

const MAX_QUERY_LENGTH = 100;

interface EventsPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { q } = await searchParams;
  const rawQuery = Array.isArray(q) ? q[0] : q;
  const query = (rawQuery ?? "").trim().slice(0, MAX_QUERY_LENGTH);

  const user = await requireAppUser();
  const all = await listEventsForUser(user.id);
  const needle = query.toLowerCase();
  const events = needle
    ? all.filter(
        (event) =>
          event.title.toLowerCase().includes(needle) || event.slug.toLowerCase().includes(needle),
      )
    : all;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Undangan</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Semua undangan digital yang pernah kamu buat dan kelola.
          </p>
        </div>
        <Button asChild className="font-semibold shadow-xs">
          <Link href="/dashboard/events/new">+ Buat Acara</Link>
        </Button>
      </div>

      {all.length > 0 && (
        <form role="search" method="get" className="flex gap-2.5">
          <label htmlFor="event-search" className="sr-only">
            Cari undangan
          </label>
          <div className="relative flex-1">
            <Input
              id="event-search"
              name="q"
              type="search"
              defaultValue={query}
              maxLength={MAX_QUERY_LENGTH}
              placeholder="Cari berdasarkan judul atau slug..."
              className="h-10 rounded-xl bg-card border-border/80 shadow-xs pl-3.5"
            />
          </div>
          <Button type="submit" variant="outline" className="h-10 px-5 font-semibold rounded-xl">
            Cari
          </Button>
        </form>
      )}

      {all.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border/70 p-12 text-center bg-card/40">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            💌
          </div>
          <p className="font-bold text-foreground text-lg">Belum ada acara.</p>
          <p className="text-muted-foreground mt-1 text-sm max-w-sm mx-auto">
            Mulai dengan membuat acara pertamamu dan atur template sesuai seleramu.
          </p>
          <Button asChild className="mt-5 font-semibold shadow-xs">
            <Link href="/dashboard/events/new">Buat Acara</Link>
          </Button>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40">
          <p className="font-semibold text-foreground text-base">Tidak ada undangan yang cocok.</p>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Coba kata kunci lain, atau{" "}
            <Link href="/dashboard/events" className="text-primary font-semibold underline underline-offset-4 hover:opacity-85">
              tampilkan semua
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  );
}
