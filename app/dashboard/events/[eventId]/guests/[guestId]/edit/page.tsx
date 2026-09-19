import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getGuestForEditor } from "@/lib/guests/service";
import { EventNotFoundError, GuestNotFoundError } from "@/lib/guests/errors";
import { GuestForm } from "@/components/guests/guest-form";

export const metadata: Metadata = {
  title: "Edit Tamu — Digital Invitation",
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
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Tamu</h1>
        <p className="text-muted-foreground mt-1 text-sm">Perbarui data {guest.name}.</p>
      </div>

      <GuestForm eventId={eventId} guest={guest} />
    </div>
  );
}
