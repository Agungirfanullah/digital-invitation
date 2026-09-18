"use client";

import { useActionState } from "react";

import { resetPasswordAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Atur ulang kata sandi</h1>
        <p className="text-muted-foreground text-sm">Masukkan kata sandi baru untuk akunmu.</p>
      </div>

      <FormError message={state.error} />

      <FormField
        label="Kata sandi baru"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.password?.[0]}
      />
      <FormField
        label="Konfirmasi kata sandi baru"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirmPassword?.[0]}
      />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan kata sandi baru"}
      </Button>
    </form>
  );
}
