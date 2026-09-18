import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseUser } from "@/lib/auth/session";
import { isSafeRedirectPath } from "@/lib/auth/urls";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk — Digital Invitation",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; reset?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const user = await getSupabaseUser();
  if (user) redirect("/dashboard");

  const next = isSafeRedirectPath(params.next) ? params.next : undefined;
  const callbackError =
    params.error === "callback_failed"
      ? "Tautan sudah tidak berlaku atau tidak valid. Silakan coba lagi."
      : undefined;

  return (
    <LoginForm
      next={next}
      resetSuccess={params.reset === "success"}
      callbackError={callbackError}
    />
  );
}
