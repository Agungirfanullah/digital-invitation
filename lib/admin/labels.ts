import type { AuditAction } from "@/lib/audit/log";

/** Indonesian labels for the audit log, shown in the admin panel. */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "event.publish": "Memublikasikan acara",
  "event.unpublish": "Membatalkan publikasi acara",
  "event.delete": "Menghapus acara",
  "guest.delete": "Menghapus tamu",
  "guest.import": "Mengimpor tamu",
  "account.update_profile": "Mengubah profil",
  "account.change_password": "Mengganti kata sandi",
  "account.delete": "Menghapus akun",
  "admin.set_role": "Admin: mengubah role",
  "admin.suspend_user": "Admin: menonaktifkan akun",
  "admin.unsuspend_user": "Admin: mengaktifkan akun",
  "admin.delete_user": "Admin: menghapus pengguna",
  "admin.publish_event": "Admin: memublikasikan acara",
  "admin.unpublish_event": "Admin: membatalkan publikasi",
  "admin.delete_event": "Admin: menghapus acara",
  "admin.set_template_active": "Admin: mengubah status template",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action as AuditAction] ?? action;
}

/**
 * Who did it. A row has no actor when a script wrote it (`via: "script"`,
 * e.g. `npm run admin:grant`) or when the actor's account is gone (deleted
 * accounts are logged without one, and later deletions null it out).
 */
export function auditActorLabel(entry: {
  user: { email: string } | null;
  metadata: unknown;
}): string {
  if (entry.user) return entry.user.email;
  const via =
    entry.metadata && typeof entry.metadata === "object"
      ? (entry.metadata as Record<string, unknown>).via
      : undefined;
  return via === "script" ? "Sistem (skrip)" : "Akun yang sudah dihapus";
}

export const ADMIN_TABS = [
  { href: "/dashboard/admin", label: "Ringkasan" },
  { href: "/dashboard/admin/users", label: "Pengguna" },
  { href: "/dashboard/admin/events", label: "Semua Acara" },
  { href: "/dashboard/admin/templates", label: "Template" },
  { href: "/dashboard/admin/audit", label: "Log Aktivitas" },
] as const;
