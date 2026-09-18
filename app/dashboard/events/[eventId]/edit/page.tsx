import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getEventForUser } from "@/lib/events/service";
import { EventNotFoundError } from "@/lib/events/errors";
import { EditEventForm } from "@/components/events/edit-event-form";

export const metadata: Metadata = {
  title: "Edit Acara — Digital Invitation",
};

interface EditEventPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
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
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Acara</h1>
        <p className="text-muted-foreground mt-1 text-sm">Perbarui informasi dasar acaramu.</p>
      </div>

      <EditEventForm
        eventId={event.id}
        defaultValues={{
          title: event.title,
          type: event.type,
          slug: event.slug,
          description: event.description,
        }}
      />
    </div>
  );
}
