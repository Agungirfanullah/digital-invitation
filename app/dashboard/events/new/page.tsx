import type { Metadata } from "next";

import { CreateEventForm } from "@/components/events/create-event-form";
import { PageHeader, Panel } from "@/components/dashboard/page-header";

export const metadata: Metadata = {
  title: "Buat Acara",
};

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        back={{ href: "/dashboard/events", label: "Undangan" }}
        title="Buat Acara"
        description={
          <>Isi informasi dasar acaramu. Detail lainnya bisa dilengkapi setelah acara dibuat.</>
        }
      />

      <Panel className="p-5 sm:p-7">
        <CreateEventForm />
      </Panel>
    </div>
  );
}
