import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import {
  getEventForUser,
  getEventStatsForUser,
  getPublishReadinessForUser,
} from "@/lib/events/service";
import { EventNotFoundError } from "@/lib/events/errors";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { EventMenuGrid } from "@/components/dashboard/event-menu-grid";
import { EventStatsRow } from "@/components/dashboard/event-stats";
import { PublishSwitch } from "@/components/dashboard/publish-switch";
import { DeleteEventButton } from "@/components/events/delete-event-button";

export const metadata: Metadata = {
  title: "Detail Acara",
};

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const user = await requireAppUser();

  let event;
  let readiness;
  let stats;
  try {
    event = await getEventForUser(eventId, user.id);
    [readiness, stats] = await Promise.all([
      getPublishReadinessForUser(eventId, user.id),
      getEventStatsForUser(eventId, user.id),
    ]);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    throw error;
  }

  const isPublished = event.status === "PUBLISHED";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/dashboard/events"
        className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
      >
        <span aria-hidden="true">←</span> Kembali ke Undangan
      </Link>

      <div className="bg-card border-border/70 overflow-hidden rounded-2xl border shadow-sm">
        <div className="from-primary via-primary/95 to-primary/85 text-primary-foreground space-y-4 bg-gradient-to-br p-5 shadow-xs sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight">{event.title}</h1>
              <p className="mt-0.5 text-xs font-medium opacity-85">
                {EVENT_TYPE_LABELS[event.type]}
              </p>
            </div>
            <PublishSwitch eventId={event.id} isPublished={isPublished} />
          </div>

          {isPublished ? (
            <Link
              href={`/invite/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-foreground inline-flex items-center gap-1.5 rounded-lg bg-black/15 px-3 py-1.5 text-xs font-semibold underline-offset-4 transition-colors hover:bg-black/25"
            >
              <span>🌐</span>
              <span className="truncate">Lihat undangan: /invite/{event.slug}</span>
            </Link>
          ) : (
            <p className="w-fit rounded-lg bg-black/15 px-3 py-1.5 text-xs opacity-85">
              🔒 Belum dipublikasikan — hanya kamu yang bisa melihat.
            </p>
          )}

          <div className="border-t border-white/15 pt-3">
            <EventStatsRow stats={stats} variant="onBand" />
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <EventMenuGrid eventId={event.id} />
        </div>
      </div>

      {!isPublished && readiness.missing.length > 0 && (
        <div className="bg-muted rounded-lg p-4 text-sm">
          <p className="font-medium">Lengkapi dulu sebelum dipublikasikan:</p>
          <ul className="text-muted-foreground mt-1 list-disc pl-5">
            {readiness.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link
            href={`/dashboard/events/${event.id}/editor`}
            className="text-foreground mt-2 inline-block underline underline-offset-4"
          >
            Buka editor undangan
          </Link>
        </div>
      )}

      <dl className="grid grid-cols-1 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Slug undangan</dt>
          <dd className="mt-0.5 break-all">/{event.slug}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Dibuat</dt>
          <dd className="mt-0.5">
            {event.createdAt.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </dd>
        </div>
        {event.description && (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Deskripsi</dt>
            <dd className="mt-0.5 whitespace-pre-wrap">{event.description}</dd>
          </div>
        )}
      </dl>

      <div className="border-t pt-4">
        <DeleteEventButton eventId={event.id} eventTitle={event.title} />
      </div>
    </div>
  );
}
