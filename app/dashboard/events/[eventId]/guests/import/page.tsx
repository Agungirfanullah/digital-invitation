import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventMemberRole } from "@prisma/client";

import { requireAppUser } from "@/lib/auth/session";
import { getAuthorizedEvent } from "@/lib/events/authorization";
import { CsvImportWizard } from "@/components/guests/csv-import-wizard";
import { PageHeader, Panel } from "@/components/dashboard/page-header";

export const metadata: Metadata = {
  title: "Impor Tamu",
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
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        back={{ href: `/dashboard/events/${eventId}/guests`, label: "Tamu" }}
        title="Impor Tamu dari CSV"
        description={
          <>
            Impor daftar tamu untuk {event.title}. Setiap tamu yang berhasil diimpor otomatis
            mendapat tautan undangan pribadi.
          </>
        }
      />

      <Panel className="p-5 sm:p-7">
        <CsvImportWizard eventId={eventId} />
      </Panel>
    </div>
  );
}
