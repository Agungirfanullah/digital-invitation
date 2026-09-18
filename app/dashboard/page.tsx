import type { Metadata } from "next";
import Link from "next/link";

import { requireAppUser } from "@/lib/auth/session";
import { listEventsForUser } from "@/lib/events/service";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard — Digital Invitation",
};

export default async function DashboardPage() {
  const user = await requireAppUser();
  const events = await listEventsForUser(user.id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Acara Saya</h1>
          <p className="text-muted-foreground mt-1 text-sm">Kelola undangan digitalmu di sini.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">Buat Acara</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Belum ada acara.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Mulai dengan membuat acara pertamamu.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/events/new">Buat Acara</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 divide-y rounded-lg border">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/dashboard/events/${event.id}`}
                className="hover:bg-accent flex items-center justify-between gap-4 p-4 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{event.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {EVENT_TYPE_LABELS[event.type]} · {EVENT_STATUS_LABELS[event.status]}
                  </p>
                </div>
                <span className="text-muted-foreground shrink-0 text-xs">/{event.slug}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
