"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/auth/provisioning";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { mapSupabaseAuthError } from "@/lib/auth/errors";
import { getAuthCallbackUrl, isSafeRedirectPath } from "@/lib/auth/urls";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";

export interface AuthActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  message?: string;
}

const RATE_LIMIT_MESSAGE = "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.";

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!(await checkAuthRateLimit("register"))) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: getAuthCallbackUrl("/dashboard"),
    },
  });

  if (error) {
    return { error: mapSupabaseAuthError(error) };
  }

  if (!data.user) {
    return { error: "Gagal membuat akun. Coba lagi." };
  }

  if (!data.session) {
    return {
      success: true,
      message:
        "Akun berhasil dibuat. Silakan cek email kamu untuk memverifikasi akun sebelum masuk.",
    };
  }

  await ensureAppUser({ id: data.user.id, email, name });
  // A brand-new Prisma User row can't own any Event yet — no query needed
  // to know this is a first-event user (D-071).
  redirect("/onboarding");
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!(await checkAuthRateLimit("login"))) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const next = formData.get("next");

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: "Email atau kata sandi tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user?.email) {
    return { error: mapSupabaseAuthError(error) };
  }

  await ensureAppUser({
    id: data.user.id,
    email: data.user.email,
    name:
      typeof data.user.user_metadata?.full_name === "string"
        ? data.user.user_metadata.full_name
        : data.user.email.split("@")[0],
  });

  // Deliberately NOT routed to onboarding here (D-071 §8's own explicit
  // regression boundary): unlike registerAction's immediate-session path,
  // `/login` is the one auth entry point every returning user goes
  // through, so it can't assume "no session at signup" implies "first
  // event." Detecting "first login after email confirmation" here would
  // require a `listEventsForUser` query on every single login and, more
  // importantly, is exactly the login-path change the task calls out as a
  // "critical regression boundary" — it is the shared entry point every
  // existing authenticated E2E fixture already depends on landing on
  // `/dashboard`. A user whose account required email confirmation before
  // their very first login (registerAction's own redirect never ran for
  // them) lands on the dashboard's existing empty state instead of
  // onboarding — a known, narrow, non-blocking gap, not a silent one.
  redirect(isSafeRedirectPath(next) ? next : "/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!(await checkAuthRateLimit("password-reset"))) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
  });

  if (!parsed.success) {
    return {
      error: "Masukkan email yang valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getAuthCallbackUrl("/reset-password"),
  });

  // Always return a generic success message, whether or not the email is
  // registered — this prevents account enumeration via this form.
  if (error) {
    console.error("[auth] resetPasswordForEmail failed", { message: error.message });
  }

  return {
    success: true,
    message: "Jika email tersebut terdaftar, kami telah mengirimkan tautan atur ulang kata sandi.",
  };
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: "Kata sandi tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "Tautan atur ulang kata sandi tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: mapSupabaseAuthError(error) };
  }

  redirect("/login?reset=success");
}
