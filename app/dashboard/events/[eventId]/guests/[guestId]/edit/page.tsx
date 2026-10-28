import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getGuestForEditor } from "@/lib/guests/service";
import { EventNotFoundError, GuestNotFoundError } from "@/lib/guests/errors";
import { GuestForm } from "@/components/guests/guest-form";
import { PageHeader, Panel } from "@/components/dashboard/page-header";

export const metadata: Metadata = {
  title: "Edit Tamu",
};

interface EditGuestPageProps {
  params: Promise<{ eventId: string; guestId: string }>;
}

export default async function EditGuestPage({ params }: EditGuestPageProps) {
  const { eventId, guestId } = await params;
  const user = await requireAppUser();

  let guest;
  try {
    guest = await getGuestForEditor(eventId, user.id, guestId);
  } catch (error) {
    if (error instanceof EventNotFoundError || error instanceof GuestNotFoundError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        back={{ href: `/dashboard/events/${eventId}/guests`, label: "Tamu" }}
        title="Edit Tamu"
        description={<>Perbarui data {guest.name}.</>}
      />

      <Panel className="p-5 sm:p-7">
        <GuestForm eventId={eventId} guest={guest} />
      </Panel>
    </div>
  );
}
