import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/admin/auth";
import { getUserDetail } from "@/lib/admin/service";
import { EVENT_STATUS_LABELS } from "@/lib/events/labels";
import { Panel } from "@/components/dashboard/page-header";
import { AdminShell, formatDate, formatDateTime } from "@/components/admin/admin-shell";
import { DeleteUserForm, RoleForm, SuspendForm } from "@/components/admin/admin-action-forms";

export const metadata: Metadata = { title: "Admin · Detail Pengguna" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await requireAdmin();
  const { userId } = await params;
  const user = await getUserDetail(userId);
  if (!user) notFound();
  const isSelf = user.id === admin.id;

  return (
    <AdminShell active="/dashboard/admin/users" title={user.name} description={user.email}>
      <Link href="/dashboard/admin/users" className="text-primary text-sm font-medium">
        ← Semua pengguna
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Panel className="p-5">
          <h2 className="font-semibold">Acara milik pengguna ({user.ownedEvents.length})</h2>
          {user.ownedEvents.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">Belum membuat acara.</p>
          ) : (
            <ul className="divide-border/60 mt-3 divide-y text-sm">
              {user.ownedEvents.map((event) => (
                <li key={event.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                  <span>
                    <span className="font-medium">{event.title}</span>
                    <span className="text-muted-foreground"> · /{event.slug}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {EVENT_STATUS_LABELS[event.status]} · {event._count.guests} tamu ·{" "}
                    {formatDate(event.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground mt-4 text-xs">
            Anggota di {user._count.eventMemberships} acara orang lain · Terdaftar{" "}
            {formatDateTime(user.createdAt)}
            {user.suspendedAt && ` · Dinonaktifkan ${formatDateTime(user.suspendedAt)}`}
          </p>
        </Panel>

        <Panel className="space-y-5 p-5">
          <h2 className="font-semibold">Kelola akun</h2>
          {isSelf ? (
            <p className="text-muted-foreground text-sm">
              Ini akunmu sendiri. Ubah lewat menu Akun; role, status, dan penghapusan akunmu tidak
              bisa diubah dari panel admin.
            </p>
          ) : (
            <>
              <RoleForm userId={user.id} role={user.role} />
              <div className="border-border/60 border-t pt-4">
                <p className="text-muted-foreground mb-2 text-xs">
                  Akun nonaktif tidak bisa masuk. Undangannya tetap tampil kecuali dibatalkan
                  publikasinya.
                </p>
                <SuspendForm userId={user.id} suspended={!!user.suspendedAt} />
              </div>
              <div className="border-border/60 border-t pt-4">
                <DeleteUserForm userId={user.id} email={user.email} />
              </div>
            </>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
