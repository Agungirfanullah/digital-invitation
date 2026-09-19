import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getGiftMethodsForUser } from "@/lib/gifts/service";
import { EventNotFoundError } from "@/lib/gifts/errors";
import { GIFT_METHOD_TYPE_LABELS } from "@/lib/gifts/labels";
import { Button } from "@/components/ui/button";
import { GiftMethodTypeBadge } from "@/components/gifts/gift-method-type-badge";
import { DeleteGiftMethodButton } from "@/components/gifts/delete-gift-method-button";

export const metadata: Metadata = {
  title: "Hadiah — Digital Invitation",
};

interface GiftsPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function GiftsPage({ params }: GiftsPageProps) {
  const { eventId } = await params;
  const user = await requireAppUser();

  let data;
  try {
    data = await getGiftMethodsForUser(eventId, user.id);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    throw error;
  }

  const canEdit = data.role === "OWNER" || data.role === "EDITOR";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← {data.event.title}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Hadiah</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Kelola metode hadiah/angpao digital yang ditampilkan di undangan publik.
            </p>
          </div>
          {canEdit && (
            <Button asChild>
              <Link href={`/dashboard/events/${eventId}/gifts/new`}>Tambah Metode</Link>
            </Button>
          )}
        </div>
      </div>

      {data.giftMethods.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Belum ada metode hadiah.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Tambahkan rekening bank, e-wallet, kode QR, atau instruksi hadiah fisik agar tamu bisa
            mengirimkan hadiah.
          </p>
          {canEdit && (
            <Button asChild className="mt-4">
              <Link href={`/dashboard/events/${eventId}/gifts/new`}>Tambah Metode</Link>
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {data.giftMethods.map((method) => (
            <li key={method.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">
                    {method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
                  </p>
                  <GiftMethodTypeBadge type={method.type} />
                  {!method.isActive && (
                    <span className="text-muted-foreground bg-muted inline-flex items-center rounded-full px-2 py-0.5 text-xs">
                      Nonaktif
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {method.accountNumber ?? method.instructions ?? "Tidak ada detail tambahan"}
                </p>
              </div>
              {canEdit && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/events/${eventId}/gifts/${method.id}/edit`}>Edit</Link>
                  </Button>
                  <DeleteGiftMethodButton
                    eventId={eventId}
                    giftMethodId={method.id}
                    label={method.providerName ?? GIFT_METHOD_TYPE_LABELS[method.type]}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
