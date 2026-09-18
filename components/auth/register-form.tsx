"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";
import { FormError } from "@/components/auth/form-error";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

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
        <h1 className="text-xl font-semibold tracking-tight">Buat akun</h1>
        <p className="text-muted-foreground text-sm">Mulai buat undangan digitalmu.</p>
      </div>

      <FormError message={state.error} />

      <FormField
        label="Nama"
        name="name"
        type="text"
        autoComplete="name"
        required
        error={state.fieldErrors?.name?.[0]}
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email?.[0]}
      />
      <FormField
        label="Kata sandi"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.password?.[0]}
      />
      <FormField
        label="Konfirmasi kata sandi"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirmPassword?.[0]}
      />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Membuat akun..." : "Buat akun"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Masuk
        </Link>
      </p>
    </form>
  );
}
