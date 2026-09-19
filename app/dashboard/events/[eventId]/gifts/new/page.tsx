import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventMemberRole } from "@prisma/client";

import { requireAppUser } from "@/lib/auth/session";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { GiftMethodForm } from "@/components/gifts/gift-method-form";

export const metadata: Metadata = {
  title: "Tambah Metode Hadiah — Digital Invitation",
};

interface NewGiftMethodPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function NewGiftMethodPage({ params }: NewGiftMethodPageProps) {
  const { eventId } = await params;
  const user = await requireAppUser();

  // EDITOR-and-above only — a VIEWER-role member would otherwise see a
  // create form that always fails on submit (createGiftMethodAction
  // enforces the same bar), which is exactly the "looks functional but
  // isn't" UI this product avoids.
  const event = await getAuthorizedEvent(eventId, user.id, EventMemberRole.EDITOR);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Tambah Metode Hadiah</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tambahkan metode hadiah baru untuk {event.title}.
        </p>
      </div>

      <GiftMethodForm eventId={eventId} />
    </div>
  );
}
