import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseUser } from "@/lib/auth/session";
import { isSafeRedirectPath } from "@/lib/auth/urls";
import { SUSPENDED_MESSAGE } from "@/lib/auth/errors";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; reset?: string; error?: string; account?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const user = await getSupabaseUser();
  if (user) redirect("/dashboard");

  const next = isSafeRedirectPath(params.next) ? params.next : undefined;
  const callbackError =
    params.error === "callback_failed"
      ? "Tautan sudah tidak berlaku atau tidak valid. Silakan coba lagi."
      : params.account === "suspended"
        ? SUSPENDED_MESSAGE
        : undefined;

  return (
    <LoginForm
      next={next}
      resetSuccess={params.reset === "success"}
      accountDeleted={params.account === "deleted"}
      callbackError={callbackError}
    />
  );
}
