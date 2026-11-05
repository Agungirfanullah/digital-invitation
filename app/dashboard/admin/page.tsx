import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin/auth";
import { auditActionLabel, auditActorLabel } from "@/lib/admin/labels";
import { getAdminOverview } from "@/lib/admin/service";
import { Panel } from "@/components/dashboard/page-header";
import { AdminShell, formatDateTime } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const data = await getAdminOverview();

  // Counted from the live database (CLAUDE.md §14).
  const tiles = [
    { label: "Pengguna", value: data.users, note: `+${data.newUsers} dalam 7 hari` },
    { label: "Akun nonaktif", value: data.suspended },
    { label: "Acara", value: data.events, note: `${data.published} dipublikasikan` },
    { label: "Tamu", value: data.guests },
    { label: "RSVP", value: data.rsvps },
    { label: "Ucapan", value: data.wishes },
  ];

  return (
    <AdminShell
      active="/dashboard/admin"
      title="Admin"
      description="Pantau dan kelola seluruh pengguna, acara, dan template."
    >
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <Panel key={tile.label} className="p-4">
            <dt className="text-muted-foreground text-xs font-medium">{tile.label}</dt>
            <dd className="text-foreground mt-1 text-2xl font-extrabold tracking-tight tabular-nums">
              {tile.value}
            </dd>
            {tile.note && <dd className="text-muted-foreground mt-0.5 text-xs">{tile.note}</dd>}
          </Panel>
        ))}
      </dl>

      <Panel className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Aktivitas terbaru</h2>
          <Link href="/dashboard/admin/audit" className="text-primary text-sm font-medium">
            Lihat semua
          </Link>
        </div>
        {data.recentAudit.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada aktivitas tercatat.</p>
        ) : (
          <ul className="divide-border/60 divide-y text-sm">
            {data.recentAudit.map((entry) => (
              <li key={entry.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
                <span>
                  <span className="font-medium">{auditActionLabel(entry.action)}</span>
                  <span className="text-muted-foreground"> · {auditActorLabel(entry)}</span>
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {formatDateTime(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}
