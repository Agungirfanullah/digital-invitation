"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginAction, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";

const initialState: AuthActionState = {};

export function LoginForm({
  next,
  resetSuccess,
  callbackError,
}: {
  next?: string;
  resetSuccess?: boolean;
  callbackError?: string;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Masuk</h1>
        <p className="text-muted-foreground text-sm">Lanjutkan mengelola undanganmu.</p>
      </div>

      {resetSuccess && (
        <p className="bg-muted text-foreground rounded-md px-3 py-2 text-sm">
          Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.
        </p>
      )}

      <FormError message={state.error ?? callbackError} />

      {next && <input type="hidden" name="next" value={next} />}

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
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password?.[0]}
      />

      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-muted-foreground text-xs underline underline-offset-4"
        >
          Lupa kata sandi?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Masuk..." : "Masuk"}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Belum punya akun?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          Buat akun
        </Link>
      </p>
    </form>
  );
}
