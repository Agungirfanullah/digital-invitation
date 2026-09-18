"use client";

import { useActionState } from "react";
import Link from "next/link";

import { requestPasswordResetAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Periksa email kamu</h1>
        <p className="text-muted-foreground text-sm">{state.message}</p>
        <Link href="/login" className="text-foreground text-sm underline underline-offset-4">
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Lupa kata sandi</h1>
        <p className="text-muted-foreground text-sm">
          Masukkan email akunmu, kami akan mengirimkan tautan atur ulang kata sandi.
        </p>
      </div>

      <FormError message={state.error} />

      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email?.[0]}
      />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Mengirim..." : "Kirim tautan atur ulang"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Kembali ke halaman masuk
        </Link>
      </p>
    </form>
  );
}
