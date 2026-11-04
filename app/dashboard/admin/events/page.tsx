import type { Metadata } from "next";
import Link from "next/link";
import { EventStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/admin/auth";
import { listEvents } from "@/lib/admin/service";
import { EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { Panel } from "@/components/dashboard/page-header";
import { AdminSearch, AdminShell, Pager, formatDate } from "@/components/admin/admin-shell";
import { EventAdminActions } from "@/components/admin/admin-action-forms";

export const metadata: Metadata = { title: "Admin · Semua Acara" };

const STATUSES = Object.values(EventStatus);

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const { q, status, page } = await searchParams;
  const query = q?.trim().slice(0, 100) || undefined;
  const statusFilter = STATUSES.find((value) => value === status);
  const result = await listEvents({ q: query, status: statusFilter, page: Number(page ?? 1) });

  return (
    <AdminShell active="/dashboard/admin/events" title="Semua Acara">
      <AdminSearch
        basePath="/dashboard/admin/events"
        q={query}
        placeholder="Cari judul, alamat undangan, atau email pemilik"
      >
        <label htmlFor="admin-status" className="sr-only">
          Status
        </label>
        <select
          id="admin-status"
          name="status"
          defaultValue={statusFilter ?? ""}
          className="border-input bg-card h-10 rounded-lg border px-3 text-sm"
        >
          <option value="">Semua status</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {EVENT_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </AdminSearch>
      <p className="text-muted-foreground text-sm">{result.total} acara</p>

      <Panel className="overflow-x-auto">
        {result.rows.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Tidak ada acara yang cocok.
          </p>
        ) : (
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="text-muted-foreground border-border/60 border-b text-left text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Acara</th>
                <th className="px-4 py-3 font-medium">Pemilik</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Tamu</th>
                <th className="px-4 py-3 font-medium">Dibuat</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {result.rows.map((event) => (
                <tr key={event.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {EVENT_TYPE_LABELS[event.type]} ·{" "}
                      {event.status === "PUBLISHED" ? (
                        <a
                          href={`/invite/${event.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          /{event.slug}
                        </a>
                      ) : (
                        `/${event.slug}`
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/admin/users/${event.owner.id}`}
                      className="hover:underline"
                    >
                      {event.owner.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{EVENT_STATUS_LABELS[event.status]}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{event._count.guests}</td>
                  <td className="text-muted-foreground px-4 py-3">{formatDate(event.createdAt)}</td>
                  <td className="px-4 py-3">
                    <EventAdminActions
                      eventId={event.id}
                      title={event.title}
                      published={event.status === "PUBLISHED"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Pager
        page={result.page}
        pages={result.pages}
        basePath="/dashboard/admin/events"
        params={{ q: query, status: statusFilter }}
      />
    </AdminShell>
  );
}
