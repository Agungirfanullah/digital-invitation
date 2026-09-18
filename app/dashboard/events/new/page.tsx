import type { Metadata } from "next";

import { CreateEventForm } from "@/components/events/create-event-form";

export const metadata: Metadata = {
  title: "Buat Acara — Digital Invitation",
};

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Buat Acara</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Isi informasi dasar acaramu. Detail lainnya bisa dilengkapi setelah acara dibuat.
        </p>
      </div>

      <CreateEventForm />
    </div>
  );
}
