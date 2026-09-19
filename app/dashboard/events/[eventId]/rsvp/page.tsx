import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getRsvpDashboardData } from "@/lib/rsvp/service";
import { EventNotFoundError } from "@/lib/rsvp/errors";
import { rsvpDashboardQuerySchema } from "@/lib/rsvp/validation";
import { GUEST_CATEGORY_LABELS } from "@/lib/guests/labels";
import { RsvpStatusBadge } from "@/components/rsvp/rsvp-status-badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "RSVP — Digital Invitation",
};

interface RsvpPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RsvpPage({ params, searchParams }: RsvpPageProps) {
  const { eventId } = await params;
  const rawQuery = await searchParams;
  const user = await requireAppUser();

  const query = rsvpDashboardQuerySchema.parse({ page: firstValue(rawQuery.page) });

  let data;
  try {
    data = await getRsvpDashboardData(eventId, user.id, query.page);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    throw error;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← {data.event.title}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">RSVP</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ringkasan konfirmasi kehadiran tamu untuk acara ini.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Total Tamu</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.counts.totalGuests}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Hadir</dt>
          <dd className="mt-0.5 text-xl font-semibold text-green-700">{data.counts.attending}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tidak Hadir</dt>
          <dd className="mt-0.5 text-xl font-semibold text-red-700">{data.counts.notAttending}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Belum Pasti</dt>
          <dd className="mt-0.5 text-xl font-semibold text-amber-700">{data.counts.maybe}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Belum Mengisi</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.counts.totalPending}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sudah Merespons</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.counts.totalResponded}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total Kuota Kursi</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.counts.totalSeatsInvited}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kursi Terkonfirmasi</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.counts.confirmedSeats}</dd>
        </div>
      </dl>

      {data.guests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Belum ada tamu.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Tambahkan tamu terlebih dahulu agar RSVP dapat dipantau di sini.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/dashboard/events/${eventId}/guests/new`}>Tambah Tamu</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <ul className="divide-y">
            {data.guests.map((guest) => (
              <li
                key={guest.guestId}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{guest.name}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {GUEST_CATEGORY_LABELS[guest.category]} · Kuota {guest.seatQuota}
                    {guest.attendance === "ATTENDING" && ` · ${guest.attendeeCount} orang hadir`}
                  </p>
                  {guest.message && (
                    <p className="mt-1 text-xs italic opacity-80">&ldquo;{guest.message}&rdquo;</p>
                  )}
                </div>
                <RsvpStatusBadge attendance={guest.attendance} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm">
          {data.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={{
                  pathname: `/dashboard/events/${eventId}/rsvp`,
                  query: { ...rawQuery, page: String(data.page - 1) },
                }}
              >
                Sebelumnya
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Sebelumnya
            </Button>
          )}
          <span className="text-muted-foreground">
            Halaman {data.page} dari {totalPages}
          </span>
          {data.page < totalPages ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={{
                  pathname: `/dashboard/events/${eventId}/rsvp`,
                  query: { ...rawQuery, page: String(data.page + 1) },
                }}
              >
                Selanjutnya
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Selanjutnya
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
