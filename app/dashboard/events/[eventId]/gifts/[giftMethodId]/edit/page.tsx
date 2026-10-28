import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getGiftMethodForEditor } from "@/lib/gifts/service";
import { EventNotFoundError, GiftMethodNotFoundError } from "@/lib/gifts/errors";
import { GiftMethodForm } from "@/components/gifts/gift-method-form";
import { PageHeader, Panel } from "@/components/dashboard/page-header";

export const metadata: Metadata = {
  title: "Edit Metode Hadiah",
};

interface EditGiftMethodPageProps {
  params: Promise<{ eventId: string; giftMethodId: string }>;
}

export default async function EditGiftMethodPage({ params }: EditGiftMethodPageProps) {
  const { eventId, giftMethodId } = await params;
  const user = await requireAppUser();

  let giftMethod;
  try {
    giftMethod = await getGiftMethodForEditor(eventId, user.id, giftMethodId);
  } catch (error) {
    if (error instanceof EventNotFoundError || error instanceof GiftMethodNotFoundError) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        back={{ href: `/dashboard/events/${eventId}/gifts`, label: "Hadiah" }}
        title="Edit Metode Hadiah"
        description={<>Perbarui detail metode hadiah ini.</>}
      />

      <Panel className="p-5 sm:p-7">
        <GiftMethodForm eventId={eventId} giftMethod={giftMethod} />
      </Panel>
    </div>
  );
}
