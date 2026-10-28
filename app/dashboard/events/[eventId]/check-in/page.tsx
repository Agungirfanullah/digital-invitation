import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getCheckInDashboardData } from "@/lib/checkin/service";
import { EventNotFoundError } from "@/lib/checkin/errors";
import { CheckInShell } from "@/components/checkin/checkin-shell";
import { PageHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = {
  title: "Check-in",
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
      <PageHeader
        back={{ href: `/dashboard/events/${eventId}`, label: data.event.title }}
        title="Check-in Tamu"
        description={
          <>Pindai kode QR undangan tamu atau cari secara manual untuk mencatat kehadiran.</>
        }
      />

      <dl className="border-border/60 bg-card grid grid-cols-2 gap-4 rounded-2xl border p-4 text-sm shadow-xs sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Total Diundang</dt>
          <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
            {data.summary.totalInvited}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Konfirmasi Hadir</dt>
          <dd className="mt-1 text-2xl font-bold tracking-tight text-green-700 tabular-nums">
            {data.summary.confirmed}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Sudah Check-in</dt>
          <dd className="text-primary mt-1 text-2xl font-bold tracking-tight tabular-nums">
            {data.summary.checkedIn}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Belum Check-in</dt>
          <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
            {data.summary.remaining}
          </dd>
        </div>
      </dl>

      {!canMutate && (
        <p className="text-muted-foreground border-border/70 bg-card/50 rounded-2xl border-2 border-dashed p-3 text-sm">
          Anda memiliki akses lihat-saja untuk acara ini. Hubungi pemilik acara untuk melakukan
          check-in tamu.
        </p>
      )}

      <CheckInShell eventId={eventId} canMutate={canMutate} />
    </div>
  );
}
