import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getAnalyticsDashboardData } from "@/lib/analytics/service";
import { EventNotFoundError } from "@/lib/analytics/errors";
import { ANALYTICS_EMPTY_STATE_LABELS } from "@/lib/analytics/labels";
import { ProgressBar } from "@/components/analytics/progress-bar";

export const metadata: Metadata = {
  title: "Analitik — Digital Invitation",
};

interface AnalyticsPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { eventId } = await params;
  const user = await requireAppUser();

  let data;
  try {
    data = await getAnalyticsDashboardData(eventId, user.id);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← {data.event.title}
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-semibold tracking-tight">Analitik</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ringkasan tayangan undangan, RSVP, ucapan, dan check-in untuk acara ini.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Undangan</h2>
        <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Total Tayangan</dt>
            <dd className="mt-0.5 text-xl font-semibold">{data.invitation.totalViews}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pengunjung Unik</dt>
            <dd className="mt-0.5 text-xl font-semibold">{data.invitation.uniqueVisitors}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Undangan Personal Dibuka</dt>
            <dd className="mt-0.5 text-xl font-semibold">{data.invitation.personalizedOpens}</dd>
          </div>
        </dl>
        {data.invitation.totalViews === 0 && (
          <p className="text-muted-foreground text-sm">{ANALYTICS_EMPTY_STATE_LABELS.noViews}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">RSVP</h2>
        <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Total Tamu</dt>
            <dd className="mt-0.5 text-xl font-semibold">{data.rsvp.totalGuests}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Akan Hadir</dt>
            <dd className="mt-0.5 text-xl font-semibold text-green-700">{data.rsvp.confirmed}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tidak Hadir</dt>
            <dd className="mt-0.5 text-xl font-semibold text-red-700">{data.rsvp.declined}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Belum Pasti</dt>
            <dd className="mt-0.5 text-xl font-semibold text-amber-700">{data.rsvp.maybe}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Belum Merespons</dt>
            <dd className="mt-0.5 text-xl font-semibold">{data.rsvp.unanswered}</dd>
          </div>
        </dl>
        {data.rsvp.totalGuests === 0 ? (
          <p className="text-muted-foreground text-sm">{ANALYTICS_EMPTY_STATE_LABELS.noRsvp}</p>
        ) : (
          <div className="rounded-lg border p-4">
            <ProgressBar percent={data.rsvp.responseRate} label="Tingkat Respons" />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Check-in</h2>
        <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Sudah Check-in</dt>
            <dd className="text-primary mt-0.5 text-xl font-semibold">{data.checkIn.checkedIn}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Belum Check-in (Konfirmasi Hadir)</dt>
            <dd className="mt-0.5 text-xl font-semibold">{data.checkIn.remainingConfirmed}</dd>
          </div>
        </dl>
        {data.checkIn.checkedIn === 0 ? (
          <p className="text-muted-foreground text-sm">{ANALYTICS_EMPTY_STATE_LABELS.noCheckIn}</p>
        ) : (
          <div className="rounded-lg border p-4">
            <ProgressBar percent={data.checkIn.progressRate} label="Progres Check-in" />
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Ucapan</h2>
          <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Total Ucapan</dt>
              <dd className="mt-0.5 text-xl font-semibold">{data.wishes.total}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Disetujui</dt>
              <dd className="mt-0.5 text-xl font-semibold">{data.wishes.approved}</dd>
            </div>
          </dl>
          {data.wishes.total === 0 && (
            <p className="text-muted-foreground text-sm">{ANALYTICS_EMPTY_STATE_LABELS.noWishes}</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Metode Hadiah</h2>
          <dl className="grid grid-cols-1 gap-4 rounded-lg border p-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Metode Aktif</dt>
              <dd className="mt-0.5 text-xl font-semibold">{data.gifts.activeMethods}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
