import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getEventForUser } from "@/lib/events/service";
import { EventNotFoundError } from "@/lib/events/errors";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { Button } from "@/components/ui/button";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import { PublishToggleButton } from "@/components/events/publish-toggle-button";

export const metadata: Metadata = {
  title: "Detail Acara — Digital Invitation",
};

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const user = await requireAppUser();

  let event;
  try {
    event = await getEventForUser(eventId, user.id);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {EVENT_TYPE_LABELS[event.type]} · {EVENT_STATUS_LABELS[event.status]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/dashboard/events/${event.id}/editor`}>Editor Undangan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/events/${event.id}/guests`}>Tamu</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/events/${event.id}/rsvp`}>RSVP</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/events/${event.id}/gifts`}>Hadiah</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/events/${event.id}/wishes`}>Ucapan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/events/${event.id}/check-in`}>Check-in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/events/${event.id}/analytics`}>Analitik</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/events/${event.id}/edit`}>Edit Acara</Link>
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Slug undangan</dt>
          <dd className="mt-0.5">/{event.slug}</dd>
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

      <div className="rounded-lg border p-4">
        <h2 className="text-sm font-medium">Publikasi</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {event.status === "PUBLISHED"
            ? "Undangan ini sudah bisa diakses publik."
            : "Undangan ini masih draf dan belum bisa diakses publik."}
        </p>

        {event.status === "PUBLISHED" && (
          <Link
            href={`/invite/${event.slug}`}
            target="_blank"
            className="text-foreground mt-2 inline-block text-sm underline underline-offset-4"
          >
            Lihat undangan publik: /invite/{event.slug}
          </Link>
        )}

        <div className="mt-4">
          <PublishToggleButton eventId={event.id} isPublished={event.status === "PUBLISHED"} />
        </div>
      </div>

      <div className="border-t pt-6">
        <DeleteEventButton eventId={event.id} eventTitle={event.title} />
      </div>
    </div>
  );
}
