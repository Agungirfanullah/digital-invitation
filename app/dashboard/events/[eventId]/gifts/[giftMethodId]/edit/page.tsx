import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getGiftMethodForEditor } from "@/lib/gifts/service";
import { EventNotFoundError, GiftMethodNotFoundError } from "@/lib/gifts/errors";
import { GiftMethodForm } from "@/components/gifts/gift-method-form";

export const metadata: Metadata = {
  title: "Edit Metode Hadiah — Digital Invitation",
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
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Metode Hadiah</h1>
        <p className="text-muted-foreground mt-1 text-sm">Perbarui detail metode hadiah ini.</p>
      </div>

      <GiftMethodForm eventId={eventId} giftMethod={giftMethod} />
    </div>
  );
}
