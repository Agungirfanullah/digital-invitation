import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getRsvpDashboardData } from "@/lib/rsvp/service";
import { EventNotFoundError } from "@/lib/rsvp/errors";
import { rsvpDashboardQuerySchema } from "@/lib/rsvp/validation";
import { RSVP_STATUS_FILTER_OPTIONS } from "@/lib/rsvp/labels";
import { GUEST_CATEGORY_LABELS, GUEST_CATEGORY_OPTIONS } from "@/lib/guests/labels";
import { formatIndonesianDateTime } from "@/lib/invitations/format";
import { RsvpStatusBadge } from "@/components/rsvp/rsvp-status-badge";
import { InvitationStatusBadge } from "@/components/guests/invitation-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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

  const query = rsvpDashboardQuerySchema.parse({
    q: firstValue(rawQuery.q),
    status: firstValue(rawQuery.status),
    category: firstValue(rawQuery.category),
    sort: firstValue(rawQuery.sort),
    page: firstValue(rawQuery.page),
  });

  let data;
  try {
    data = await getRsvpDashboardData(eventId, user.id, query);
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
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ringkasan RSVP</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Pantau konfirmasi kehadiran tamu untuk acara ini.
            </p>
          </div>
          <Button asChild variant="outline">
            <a href={`/dashboard/events/${eventId}/rsvp/export`}>Ekspor CSV</a>
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Total Tamu</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.counts.totalGuests}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Akan Hadir</dt>
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
          <dt className="text-muted-foreground">Belum Merespons</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.counts.totalPending}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tingkat Respons</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.counts.responseRate}%</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total Kuota Kursi</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.counts.totalSeatsInvited}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Orang Akan Hadir</dt>
          <dd className="mt-0.5 text-xl font-semibold">{data.counts.confirmedSeats}</dd>
        </div>
      </dl>

      {data.counts.totalGuests > 0 && data.counts.totalResponded === 0 && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
          Belum ada tamu yang mengisi RSVP. Bagikan tautan undangan pribadi masing-masing tamu agar
          mereka dapat merespons.
        </p>
      )}

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="min-w-[180px] flex-1 space-y-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Cari Tamu
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="Nama, telepon, atau email"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Filter Status
          </label>
          <Select id="status" name="status" defaultValue={query.status}>
            {RSVP_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-sm font-medium">
            Kategori
          </label>
          <Select id="category" name="category" defaultValue={query.category}>
            <option value="ALL">Semua kategori</option>
            {GUEST_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sort" className="text-sm font-medium">
            Urutkan
          </label>
          <Select id="sort" name="sort" defaultValue={query.sort}>
            <option value="name_asc">Nama (A-Z)</option>
            <option value="name_desc">Nama (Z-A)</option>
          </Select>
        </div>
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
      </form>

      {data.counts.totalGuests === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Belum ada tamu.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Tambahkan tamu terlebih dahulu agar RSVP dapat dipantau di sini.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/dashboard/events/${eventId}/guests/new`}>Tambah Tamu</Link>
          </Button>
        </div>
      ) : data.guests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Tidak ada tamu yang cocok.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Tidak ada tamu yang cocok dengan pencarian/filter ini.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <ul className="divide-y">
            {data.guests.map((guest) => (
              <li
                key={guest.guestId}
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/events/${eventId}/guests/${guest.guestId}/invitation`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {guest.name}
                    </Link>
                    <RsvpStatusBadge attendance={guest.attendance} />
                    <InvitationStatusBadge status={guest.invitationStatus} />
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {GUEST_CATEGORY_LABELS[guest.category]} · Kuota {guest.seatQuota}
                    {guest.attendance === "ATTENDING" && ` · ${guest.attendeeCount} orang hadir`}
                    {guest.submittedAt &&
                      ` · Merespons ${formatIndonesianDateTime(guest.submittedAt)}`}
                  </p>
                  {guest.message && (
                    <p className="mt-1 text-xs italic opacity-80">&ldquo;{guest.message}&rdquo;</p>
                  )}
                </div>
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
