import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin/auth";
import { listUsers } from "@/lib/admin/service";
import { Panel } from "@/components/dashboard/page-header";
import { AdminSearch, AdminShell, Pager, formatDate } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "Admin · Pengguna" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const { q, page } = await searchParams;
  const query = q?.trim().slice(0, 100) || undefined;
  const result = await listUsers({ q: query, page: Number(page ?? 1) });

  return (
    <AdminShell active="/dashboard/admin/users" title="Pengguna">
      <AdminSearch basePath="/dashboard/admin/users" q={query} placeholder="Cari nama atau email" />
      <p className="text-muted-foreground text-sm">{result.total} pengguna</p>

      <Panel className="overflow-x-auto">
        {result.rows.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Tidak ada pengguna yang cocok.
          </p>
        ) : (
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-muted-foreground border-border/60 border-b text-left text-xs">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Acara</th>
                <th className="px-4 py-3 font-medium">Daftar</th>
              </tr>
            </thead>
            <tbody className="divide-border/60 divide-y">
              {result.rows.map((user) => (
                <tr key={user.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/admin/users/${user.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {user.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1">
                      {user.role === "ADMIN" && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Admin
                        </span>
                      )}
                      {user.suspendedAt ? (
                        <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium">
                          Nonaktif
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Aktif
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{user._count.ownedEvents}</td>
                  <td className="text-muted-foreground px-4 py-3">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Pager
        page={result.page}
        pages={result.pages}
        basePath="/dashboard/admin/users"
        params={{ q: query }}
      />
    </AdminShell>
  );
}
