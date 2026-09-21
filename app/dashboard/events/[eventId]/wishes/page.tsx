import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getWishesForModeration } from "@/lib/wishes/service";
import { EventNotFoundError } from "@/lib/wishes/errors";
import { wishModerationQuerySchema } from "@/lib/wishes/validation";
import { WISH_STATUS_FILTER_OPTIONS } from "@/lib/wishes/labels";
import { formatIndonesianDateTime } from "@/lib/invitations/format";
import { ModerateWishButtons } from "@/components/wishes/moderate-wish-buttons";
import { WishStatusBadge } from "@/components/wishes/wish-status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export const metadata: Metadata = {
  title: "Ucapan — Digital Invitation",
};

interface WishesPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function WishesPage({ params, searchParams }: WishesPageProps) {
  const { eventId } = await params;
  const rawQuery = await searchParams;
  const user = await requireAppUser();

  const query = wishModerationQuerySchema.parse({
    status: firstValue(rawQuery.status),
    page: firstValue(rawQuery.page),
  });

  let data;
  try {
    data = await getWishesForModeration(eventId, user.id, query);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    throw error;
  }

  const canModerate = data.role === "OWNER" || data.role === "EDITOR";
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

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
          <h1 className="text-2xl font-semibold tracking-tight">Ucapan &amp; Doa</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola ucapan dari tamu. Hanya ucapan yang disetujui akan tampil di undangan publik.
          </p>
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
        <div className="space-y-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Filter Status
          </label>
          <Select id="status" name="status" defaultValue={query.status}>
            {WISH_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
      </form>

      {data.wishes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Belum ada ucapan.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Ucapan dari tamu akan muncul di sini setelah mereka mengirimkannya melalui tautan
            undangan pribadi mereka.
          </p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border">
          {data.wishes.map((wish) => (
            <li key={wish.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{wish.name}</p>
                  <WishStatusBadge status={wish.status} />
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Tamu: {wish.guestName} · {formatIndonesianDateTime(wish.createdAt)}
                </p>
                <p className="mt-2 text-sm whitespace-pre-wrap">{wish.message}</p>
              </div>
              {canModerate && (
                <ModerateWishButtons eventId={eventId} wishId={wish.id} status={wish.status} />
              )}
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm">
          {data.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={{
                  pathname: `/dashboard/events/${eventId}/wishes`,
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
                  pathname: `/dashboard/events/${eventId}/wishes`,
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
