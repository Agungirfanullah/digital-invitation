import type { Metadata } from "next";
import Link from "next/link";

import { getSupabaseUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Atur Ulang Kata Sandi — Digital Invitation",
};

export default async function ResetPasswordPage() {
  // A password-recovery link (via /auth/callback) establishes a real
  // session for this flow, so we intentionally do NOT redirect an
  // authenticated user away from this page — they need to reach the form.
  const user = await getSupabaseUser();

  if (!user) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Tautan tidak valid</h1>
        <p className="text-muted-foreground text-sm">
          Tautan atur ulang kata sandi tidak valid atau sudah kedaluwarsa.
        </p>
        <Link
          href="/forgot-password"
          className="text-foreground text-sm underline underline-offset-4"
        >
          Minta tautan baru
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
