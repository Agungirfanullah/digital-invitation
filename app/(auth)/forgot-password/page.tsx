import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseUser } from "@/lib/auth/session";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi — Digital Invitation",
};

export default async function ForgotPasswordPage() {
  const user = await getSupabaseUser();
  if (user) redirect("/dashboard");

  return <ForgotPasswordForm />;
}
