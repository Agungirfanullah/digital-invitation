import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getCheckInDashboardData } from "@/lib/checkin/service";
import { EventNotFoundError } from "@/lib/checkin/errors";
import { CheckInShell } from "@/components/checkin/checkin-shell";

export const metadata: Metadata = {
  title: "Check-in — Digital Invitation",
};

interface CheckInPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function CheckInPage({ params }: CheckInPageProps) {
  const { eventId } = await params;
  const user = await requireAppUser();

  let data;
  try {
    data = await getCheckInDashboardData(eventId, user.id);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    throw error;
  }

  const canMutate = data.role === "OWNER" || data.role === "EDITOR";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← {data.event.title}
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-semibold tracking-tight">Check-in Tamu</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pindai kode QR undangan tamu atau cari secara manual untuk mencatat kehadiran.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Total Diundang</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.summary.totalInvited}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Konfirmasi Hadir</dt>
          <dd className="mt-0.5 text-xl font-semibold text-green-700">{data.summary.confirmed}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sudah Check-in</dt>
          <dd className="text-primary mt-0.5 text-xl font-semibold">{data.summary.checkedIn}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Belum Check-in</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.summary.remaining}</dd>
        </div>
      </dl>

      {!canMutate && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          Anda memiliki akses lihat-saja untuk acara ini. Hubungi pemilik acara untuk melakukan
          check-in tamu.
        </p>
      )}

      <CheckInShell eventId={eventId} canMutate={canMutate} />
    </div>
  );
}
