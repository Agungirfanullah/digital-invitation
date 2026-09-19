import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getGuestPageData } from "@/lib/guests/service";
import { buildGuestInvitationUrl } from "@/lib/guests/invitation-url";
import { EventNotFoundError } from "@/lib/guests/errors";
import { guestListQuerySchema } from "@/lib/guests/validation";
import { GUEST_CATEGORY_OPTIONS, GUEST_INVITATION_STATUS_LABELS } from "@/lib/guests/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { GuestCategoryBadge } from "@/components/guests/guest-category-badge";
import { DeleteGuestButton } from "@/components/guests/delete-guest-button";
import { CopyInviteLinkButton } from "@/components/guests/copy-invite-link-button";

export const metadata: Metadata = {
  title: "Tamu — Digital Invitation",
};

interface GuestsPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GuestsPage({ params, searchParams }: GuestsPageProps) {
  const { eventId } = await params;
  const rawQuery = await searchParams;
  const user = await requireAppUser();

  const query = guestListQuerySchema.parse({
    q: firstValue(rawQuery.q),
    category: firstValue(rawQuery.category),
    sort: firstValue(rawQuery.sort),
    page: firstValue(rawQuery.page),
  });

  let data;
  try {
    data = await getGuestPageData(eventId, user.id, query);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    throw error;
  }

  const canEdit = data.role === "OWNER" || data.role === "EDITOR";
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const isFiltered = Boolean(query.q) || query.category !== "ALL";

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
            <h1 className="text-2xl font-semibold tracking-tight">Tamu</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {data.total} tamu terdaftar di acara ini.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button asChild variant="outline">
                <Link href={`/dashboard/events/${eventId}/guests/import`}>Impor CSV</Link>
              </Button>
            )}
            {/* Export is VIEWER-and-above, same as the list itself (D-023) — never gated behind canEdit. */}
            <Button asChild variant="outline">
              <a href={`/dashboard/events/${eventId}/guests/export`}>Ekspor CSV</a>
            </Button>
            {canEdit && (
              <Button asChild>
                <Link href={`/dashboard/events/${eventId}/guests/new`}>Tambah Tamu</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="min-w-[180px] flex-1 space-y-1.5">
          <label htmlFor="q" className="text-sm font-medium">
            Cari
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="Nama, telepon, atau email"
          />
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
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name_asc">Nama (A-Z)</option>
            <option value="name_desc">Nama (Z-A)</option>
          </Select>
        </div>
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
      </form>

      {data.guests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Belum ada tamu.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {isFiltered
              ? "Tidak ada tamu yang cocok dengan pencarian/filter ini."
              : "Tambahkan tamu secara manual atau impor dari CSV."}
          </p>
          {canEdit && !isFiltered && (
            <Button asChild className="mt-4">
              <Link href={`/dashboard/events/${eventId}/guests/new`}>Tambah Tamu</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <ul className="divide-y">
            {data.guests.map((guest) => {
              // `guest.invitationToken` is masked to `null` for a VIEWER
              // (see lib/guests/service.ts's toListItem) — canEdit is
              // always true whenever a real token is present here.
              const inviteLink =
                canEdit && guest.invitationToken
                  ? buildGuestInvitationUrl(data.event.slug, guest.invitationToken)
                  : null;
              return (
                <li
                  key={guest.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{guest.name}</p>
                      <GuestCategoryBadge category={guest.category} />
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {guest.phone ?? "Tanpa nomor telepon"} · Kuota {guest.seatQuota} ·{" "}
                      {GUEST_INVITATION_STATUS_LABELS[guest.invitationStatus]}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/events/${eventId}/guests/${guest.id}/invitation`}>
                        Undangan
                      </Link>
                    </Button>
                    {/* Invitation tokens are a personalization secret (excluded from CSV export too) — never surfaced to a VIEWER (D-023). */}
                    {inviteLink && <CopyInviteLinkButton link={inviteLink} />}
                    {canEdit && (
                      <>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/events/${eventId}/guests/${guest.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <DeleteGuestButton
                          eventId={eventId}
                          guestId={guest.id}
                          guestName={guest.name}
                        />
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm">
          {data.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={{
                  pathname: `/dashboard/events/${eventId}/guests`,
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
                  pathname: `/dashboard/events/${eventId}/guests`,
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
