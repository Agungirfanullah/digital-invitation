import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventMemberRole } from "@prisma/client";

import { requireAppUser } from "@/lib/auth/session";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { GiftMethodForm } from "@/components/gifts/gift-method-form";
import { PageHeader, Panel } from "@/components/dashboard/page-header";

export const metadata: Metadata = {
  title: "Tambah Metode Hadiah",
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
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        back={{ href: `/dashboard/events/${eventId}/gifts`, label: "Hadiah" }}
        title="Tambah Metode Hadiah"
        description={<>Tambahkan metode hadiah baru untuk {event.title}.</>}
      />

      <Panel className="p-5 sm:p-7">
        <GiftMethodForm eventId={eventId} />
      </Panel>
    </div>
  );
}
