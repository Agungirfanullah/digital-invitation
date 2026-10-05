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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Undangan</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Semua undangan yang pernah kamu buat.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">Buat Acara</Link>
        </Button>
      </div>

      {all.length > 0 && (
        <form role="search" method="get" className="flex gap-2">
          <label htmlFor="event-search" className="sr-only">
            Cari undangan
          </label>
          <Input
            id="event-search"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={MAX_QUERY_LENGTH}
            placeholder="Cari undangan..."
          />
          <Button type="submit" variant="outline">
            Cari
          </Button>
        </form>
      )}

      {all.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Belum ada acara.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Mulai dengan membuat acara pertamamu.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/events/new">Buat Acara</Link>
          </Button>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Tidak ada undangan yang cocok.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Coba kata kunci lain, atau{" "}
            <Link href="/dashboard/events" className="underline underline-offset-4">
              tampilkan semua
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </div>
  );
}
