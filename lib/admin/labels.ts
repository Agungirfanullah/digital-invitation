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

export const ADMIN_TABS = [
  { href: "/dashboard/admin", label: "Ringkasan" },
  { href: "/dashboard/admin/users", label: "Pengguna" },
  { href: "/dashboard/admin/events", label: "Semua Acara" },
  { href: "/dashboard/admin/templates", label: "Template" },
  { href: "/dashboard/admin/audit", label: "Log Aktivitas" },
] as const;
