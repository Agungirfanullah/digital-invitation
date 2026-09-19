import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventMemberRole } from "@prisma/client";

import { requireAppUser } from "@/lib/auth/session";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { CsvImportWizard } from "@/components/guests/csv-import-wizard";

export const metadata: Metadata = {
  title: "Impor Tamu — Digital Invitation",
};

interface ImportGuestsPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function ImportGuestsPage({ params }: ImportGuestsPageProps) {
  const { eventId } = await params;
  const user = await requireAppUser();

  const event = await getAuthorizedEvent(eventId, user.id, EventMemberRole.EDITOR);
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Impor Tamu dari CSV</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Impor daftar tamu untuk {event.title}. Setiap tamu yang berhasil diimpor otomatis mendapat
          tautan undangan pribadi.
        </p>
      </div>

      <CsvImportWizard eventId={eventId} />
    </div>
  );
}
