import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getEventForUser } from "@/lib/events/service";
import { EventNotFoundError } from "@/lib/events/errors";
import { EditEventForm } from "@/components/events/edit-event-form";
import { PageHeader, Panel } from "@/components/dashboard/page-header";

export const metadata: Metadata = {
  title: "Edit Acara",
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
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        back={{ href: `/dashboard/events/${event.id}`, label: event.title }}
        title="Edit Acara"
        description={<>Perbarui informasi dasar acaramu.</>}
      />

      <Panel className="p-5 sm:p-7">
        <EditEventForm
          eventId={event.id}
          defaultValues={{
            title: event.title,
            type: event.type,
            slug: event.slug,
            description: event.description,
          }}
        />
      </Panel>
    </div>
  );
}
