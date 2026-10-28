import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getAnalyticsDashboardData } from "@/lib/analytics/service";
import { EventNotFoundError } from "@/lib/analytics/errors";
import { ANALYTICS_EMPTY_STATE_LABELS } from "@/lib/analytics/labels";
import { ProgressBar } from "@/components/analytics/progress-bar";
import { PageHeader } from "@/components/dashboard/page-header";

export const metadata: Metadata = {
  title: "Analitik",
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
      <PageHeader
        back={{ href: `/dashboard/events/${eventId}`, label: data.event.title }}
        title="Analitik"
        description={<>Ringkasan tayangan undangan, RSVP, ucapan, dan check-in untuk acara ini.</>}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Undangan</h2>
        <dl className="border-border/60 bg-card grid grid-cols-2 gap-4 rounded-2xl border p-4 text-sm shadow-xs sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Total Tayangan</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {data.invitation.totalViews}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium sm:text-sm">
              Pengunjung Unik
            </dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {data.invitation.uniqueVisitors}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium sm:text-sm">
              Undangan Personal Dibuka
            </dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {data.invitation.personalizedOpens}
            </dd>
          </div>
        </dl>
        {data.invitation.totalViews === 0 && (
          <p className="text-muted-foreground text-sm">{ANALYTICS_EMPTY_STATE_LABELS.noViews}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">RSVP</h2>
        <dl className="border-border/60 bg-card grid grid-cols-2 gap-4 rounded-2xl border p-4 text-sm shadow-xs sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Total Tamu</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {data.rsvp.totalGuests}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Akan Hadir</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-green-700 tabular-nums">
              {data.rsvp.confirmed}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Tidak Hadir</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-red-700 tabular-nums">
              {data.rsvp.declined}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Belum Pasti</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
              {data.rsvp.maybe}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium sm:text-sm">
              Belum Merespons
            </dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {data.rsvp.unanswered}
            </dd>
          </div>
        </dl>
        {data.rsvp.totalGuests === 0 ? (
          <p className="text-muted-foreground text-sm">{ANALYTICS_EMPTY_STATE_LABELS.noRsvp}</p>
        ) : (
          <div className="border-border/60 bg-card rounded-2xl border p-4 shadow-xs">
            <ProgressBar percent={data.rsvp.responseRate} label="Tingkat Respons" />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Check-in</h2>
        <dl className="border-border/60 bg-card grid grid-cols-2 gap-4 rounded-2xl border p-4 text-sm shadow-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Sudah Check-in</dt>
            <dd className="text-primary mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {data.checkIn.checkedIn}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs font-medium sm:text-sm">
              Belum Check-in (Konfirmasi Hadir)
            </dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
              {data.checkIn.remainingConfirmed}
            </dd>
          </div>
        </dl>
        {data.checkIn.checkedIn === 0 ? (
          <p className="text-muted-foreground text-sm">{ANALYTICS_EMPTY_STATE_LABELS.noCheckIn}</p>
        ) : (
          <div className="border-border/60 bg-card rounded-2xl border p-4 shadow-xs">
            <ProgressBar percent={data.checkIn.progressRate} label="Progres Check-in" />
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Ucapan</h2>
          <dl className="border-border/60 bg-card grid grid-cols-2 gap-4 rounded-2xl border p-4 text-sm shadow-xs">
            <div>
              <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Total Ucapan</dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                {data.wishes.total}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Disetujui</dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                {data.wishes.approved}
              </dd>
            </div>
          </dl>
          {data.wishes.total === 0 && (
            <p className="text-muted-foreground text-sm">{ANALYTICS_EMPTY_STATE_LABELS.noWishes}</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Metode Hadiah</h2>
          <dl className="border-border/60 bg-card grid grid-cols-1 gap-4 rounded-2xl border p-4 text-sm shadow-xs">
            <div>
              <dt className="text-muted-foreground text-xs font-medium sm:text-sm">Metode Aktif</dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight tabular-nums">
                {data.gifts.activeMethods}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
