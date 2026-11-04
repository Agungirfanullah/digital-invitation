"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin/auth";
import {
  AdminActionError,
  adminDeleteEvent,
  adminDeleteUser,
  adminUnpublishEvent,
  setTemplateActive,
  setUserRole,
  setUserSuspended,
} from "@/lib/admin/service";
import { AccountDeleteBlockedError } from "@/lib/account/service";

export interface AdminActionState {
  error?: string;
  success?: string;
}

const id = z.string().min(1).max(64);

function failure(error: unknown): AdminActionState {
  if (error instanceof AdminActionError) return { error: error.message };
  if (error instanceof AccountDeleteBlockedError) {
    return { error: "Pengguna ini punya catatan pembayaran atau transaksi yang wajib disimpan." };
  }
  console.error("[admin] action failed", error);
  return { error: "Gagal menjalankan aksi. Coba lagi." };
}

export async function setUserRoleAction(
  userId: string,
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ userId: id, role: z.enum(UserRole) })
    .safeParse({ userId, role: formData.get("role") });
  if (!parsed.success) return { error: "Role tidak valid." };
  try {
    await setUserRole(admin.id, parsed.data.userId, parsed.data.role);
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/dashboard/admin/users/${userId}`);
  return { success: "Role diperbarui." };
}

export async function setUserSuspendedAction(
  userId: string,
  suspended: boolean,
  _prev: AdminActionState,
  _formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!id.safeParse(userId).success) return { error: "Pengguna tidak valid." };
  try {
    await setUserSuspended(admin.id, userId, suspended);
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/dashboard/admin/users/${userId}`);
  return { success: suspended ? "Akun dinonaktifkan." : "Akun diaktifkan kembali." };
}

export async function deleteUserAction(
  userId: string,
  email: string,
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!id.safeParse(userId).success) return { error: "Pengguna tidak valid." };
  const typed = String(formData.get("confirmEmail") ?? "")
    .trim()
    .toLowerCase();
  if (typed !== email.toLowerCase()) return { error: "Email konfirmasi tidak cocok." };
  try {
    await adminDeleteUser(admin.id, userId);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/dashboard/admin/users");
  redirect("/dashboard/admin/users");
}

export async function unpublishEventAction(
  eventId: string,
  _prev: AdminActionState,
  _formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!id.safeParse(eventId).success) return { error: "Acara tidak valid." };
  try {
    await adminUnpublishEvent(admin.id, eventId);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/dashboard/admin/events");
  return { success: "Undangan tidak lagi dipublikasikan." };
}

export async function deleteEventAction(
  eventId: string,
  _prev: AdminActionState,
  _formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!id.safeParse(eventId).success) return { error: "Acara tidak valid." };
  try {
    await adminDeleteEvent(admin.id, eventId);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/dashboard/admin/events");
  return { success: "Acara dihapus." };
}

export async function setTemplateActiveAction(
  templateId: string,
  active: boolean,
  _prev: AdminActionState,
  _formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  if (!id.safeParse(templateId).success) return { error: "Template tidak valid." };
  try {
    await setTemplateActive(admin.id, templateId, active);
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/dashboard/admin/templates");
  return { success: active ? "Template diaktifkan." : "Template dinonaktifkan." };
}
