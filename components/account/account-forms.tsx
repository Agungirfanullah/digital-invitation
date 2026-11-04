"use client";

import { useActionState, useState } from "react";

import {
  changePasswordAction,
  deleteAccountAction,
  updateProfileAction,
  type AccountFormState,
} from "@/lib/account/actions";
import { FormError } from "@/components/forms/form-error";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";

const initialState: AccountFormState = {};

function SuccessNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      {message}
    </p>
  );
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <SuccessNote message={state.success} />
      <FormError message={state.error} />
      <FormField
        label="Nama"
        name="name"
        defaultValue={name}
        autoComplete="name"
        maxLength={100}
        error={state.fieldErrors?.name?.[0]}
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        value={email}
        readOnly
        disabled
        hint="Email dipakai untuk masuk dan belum bisa diganti."
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan Nama"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  // Remount after success so the password fields clear.
  const [formKey, setFormKey] = useState(0);
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state.success) setFormKey((key) => key + 1);
  }

  return (
    <form key={formKey} action={formAction} className="space-y-4" noValidate>
      <SuccessNote message={state.success} />
      <FormError message={state.error} />
      <FormField
        label="Kata sandi saat ini"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.currentPassword?.[0]}
      />
      <FormField
        label="Kata sandi baru"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Minimal 8 karakter, berisi huruf dan angka."
        error={state.fieldErrors?.password?.[0]}
      />
      <FormField
        label="Ulangi kata sandi baru"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword?.[0]}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Mengganti..." : "Ganti Kata Sandi"}
      </Button>
    </form>
  );
}

export function DeleteAccountForm({ email, eventCount }: { email: string; eventCount: number }) {
  const [state, formAction, pending] = useActionState(deleteAccountAction, initialState);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
        Hapus Akun
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="border-destructive/30 bg-destructive/5 space-y-1.5 rounded-xl border p-4 text-sm">
        <p className="font-semibold">Yang akan terhapus permanen:</p>
        <ul className="text-muted-foreground list-disc space-y-0.5 pl-5">
          <li>Akun dan data loginmu</li>
          <li>
            {eventCount > 0
              ? `${eventCount} acara milikmu beserta tamu, RSVP, ucapan, dan foto`
              : "Semua acara milikmu (saat ini belum ada)"}
          </li>
          <li>Keanggotaanmu di acara milik orang lain</li>
        </ul>
        <p className="text-muted-foreground pt-1">
          Undangan yang sudah dibagikan tidak bisa dibuka lagi. Tindakan ini tidak dapat dibatalkan.
        </p>
      </div>
      <FormError message={state.error} />
      <FormField
        label={`Ketik ${email} untuk konfirmasi`}
        name="confirmEmail"
        type="email"
        autoComplete="off"
        error={state.fieldErrors?.confirmEmail?.[0]}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Menghapus..." : "Hapus Akun Permanen"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
