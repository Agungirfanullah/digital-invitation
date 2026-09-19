import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventMemberRole } from "@prisma/client";

import { requireAppUser } from "@/lib/auth/session";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { GuestForm } from "@/components/guests/guest-form";

export const metadata: Metadata = {
  title: "Tambah Tamu — Digital Invitation",
};

interface NewGuestPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function NewGuestPage({ params }: NewGuestPageProps) {
  const { eventId } = await params;
  const user = await requireAppUser();

  // EDITOR-and-above only — a VIEWER-role member would otherwise see a
  // create form that always fails on submit (createGuestAction enforces
  // the same bar), which is exactly the "looks functional but isn't" UI
  // this product avoids.
  const event = await getAuthorizedEvent(eventId, user.id, EventMemberRole.EDITOR);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Tambah Tamu</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tambahkan tamu baru untuk {event.title}. Tautan undangan pribadi dibuat otomatis.
        </p>
      </div>

      <GuestForm eventId={eventId} />
    </div>
  );
}
