import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/auth";
import { AUDIT_ACTION_LABELS, auditActionLabel, auditActorLabel } from "@/lib/admin/labels";
import { listAuditLogs } from "@/lib/admin/service";
import { Panel } from "@/components/dashboard/page-header";
import { AdminShell, Pager, formatDateTime } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "Admin · Log Aktivitas" };

const ACTIONS = Object.keys(AUDIT_ACTION_LABELS);

function describeMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  return Object.entries(metadata as Record<string, unknown>)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  await requireAdmin();
  const { action, page } = await searchParams;
  const actionFilter = ACTIONS.find((value) => value === action);
  const result = await listAuditLogs({ action: actionFilter, page: Number(page ?? 1) });

  return (
    <AdminShell
      active="/dashboard/admin/audit"
      title="Log Aktivitas"
      description="Catatan perubahan penting: publikasi, penghapusan, impor tamu, perubahan akun, dan aksi admin."
    >
      <form action="/dashboard/admin/audit" className="flex flex-wrap gap-2">
        <label htmlFor="admin-action" className="sr-only">
          Jenis aktivitas
        </label>
        <select
          id="admin-action"
          name="action"
          defaultValue={actionFilter ?? ""}
          className="border-input bg-card h-10 rounded-lg border px-3 text-sm"
        >
          <option value="">Semua aktivitas</option>
          {ACTIONS.map((value) => (
            <option key={value} value={value}>
              {auditActionLabel(value)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-primary text-primary-foreground h-10 rounded-lg px-4 text-sm font-medium"
        >
          Tampilkan
        </button>
      </form>

      <Panel className="overflow-x-auto">
        {result.rows.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Belum ada aktivitas tercatat.
          </p>
        ) : (
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="text-muted-foreground border-border/60 border-b text-left text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Aktivitas</th>
                <th className="px-4 py-3 font-medium">Oleh</th>
                <th className="px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {result.rows.map((entry) => (
                <tr key={entry.id} className="align-top">
                  <td className="text-muted-foreground px-4 py-3 whitespace-nowrap tabular-nums">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium">{auditActionLabel(entry.action)}</td>
                  <td className="px-4 py-3">{auditActorLabel(entry)}</td>
                  <td className="text-muted-foreground px-4 py-3 text-xs break-all">
                    {entry.resourceType}
                    {entry.resourceId && ` ${entry.resourceId}`}
                    {describeMetadata(entry.metadata) && ` · ${describeMetadata(entry.metadata)}`}
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
        basePath="/dashboard/admin/audit"
        params={{ action: actionFilter }}
      />
    </AdminShell>
  );
}
