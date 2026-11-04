"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AccountDeleteBlockedError, deleteAccount, updateAccountName } from "@/lib/account/service";
import { changePasswordSchema, deleteAccountSchema, profileSchema } from "@/lib/account/validation";
import { recordAudit } from "@/lib/audit/log";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { requireAppUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AccountFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: string;
}

const RATE_LIMIT_MESSAGE = "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.";

export async function updateProfileAction(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const user = await requireAppUser();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: "Periksa kembali isian.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateAccountName(user.id, parsed.data.name);
  } catch (error) {
    console.error("[account] update profile failed", error);
    return { error: "Gagal menyimpan perubahan. Coba lagi." };
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Nama berhasil diperbarui." };
}

export async function changePasswordAction(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const user = await requireAppUser();
  if (!(await checkAuthRateLimit("password-change"))) return { error: RATE_LIMIT_MESSAGE };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: "Periksa kembali isian.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  // Proves the person at the keyboard knows the current password, so a
  // session left open on someone else's device cannot take the account over.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return { fieldErrors: { currentPassword: ["Kata sandi saat ini salah."] } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("[account] change password failed", { message: error.message });
    return { error: "Gagal mengganti kata sandi. Coba lagi." };
  }

  await recordAudit({
    userId: user.id,
    action: "account.change_password",
    resourceType: "user",
    resourceId: user.id,
  });
  return { success: "Kata sandi berhasil diganti." };
}

export async function deleteAccountAction(
  _prevState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const user = await requireAppUser();
  const parsed = deleteAccountSchema(user.email).safeParse({
    confirmEmail: formData.get("confirmEmail"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await deleteAccount(user.id);
  } catch (error) {
    if (error instanceof AccountDeleteBlockedError) {
      return {
        error:
          "Akun ini masih punya catatan pembayaran atau transaksi hadiah yang wajib disimpan, jadi belum bisa dihapus. Hubungi kami untuk bantuan.",
      };
    }
    console.error("[account] delete failed", error);
    return { error: "Gagal menghapus akun. Coba lagi." };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login?account=deleted");
}
