import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseUser } from "@/lib/auth/session";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Buat Akun — Digital Invitation",
};

export default async function RegisterPage() {
  const user = await getSupabaseUser();
  if (user) redirect("/dashboard");

  return <RegisterForm />;
}
