import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/auth";
import { listTemplates } from "@/lib/admin/service";
import { isKnownTemplateKey } from "@/lib/invitations/templates/registry";
import { Panel } from "@/components/dashboard/page-header";
import { AdminShell } from "@/components/admin/admin-shell";
import { TemplateToggle } from "@/components/admin/admin-action-forms";

export const metadata: Metadata = { title: "Admin · Template" };

export default async function AdminTemplatesPage() {
  await requireAdmin();
  const templates = await listTemplates();

  return (
    <AdminShell
      active="/dashboard/admin/templates"
      title="Template"
      description="Template nonaktif hilang dari pilihan di editor. Acara yang sudah memakainya tetap tampil seperti biasa."
    >
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="text-muted-foreground border-border/60 border-b text-left text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Dipakai</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {templates.map((template) => (
              <tr key={template.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{template.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {template.slug}
                    {!isKnownTemplateKey(template.slug) && " · belum ada tampilannya"}
                  </p>
                </td>
                <td className="px-4 py-3">{template.isActive ? "Aktif" : "Nonaktif"}</td>
                <td className="px-4 py-3 text-right tabular-nums">{template.events} acara</td>
                <td className="px-4 py-3 text-right">
                  <TemplateToggle templateId={template.id} active={template.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AdminShell>
  );
}
