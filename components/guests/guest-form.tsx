"use client";

import { useActionState } from "react";

import { createGuestAction, updateGuestAction, type GuestFormState } from "@/lib/guests/actions";
import type { GuestDetail } from "@/lib/guests/types";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";
import { GuestCategoryField } from "@/components/guests/guest-category-field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const initialState: GuestFormState = {};

export function GuestForm({ eventId, guest }: { eventId: string; guest?: GuestDetail }) {
  const action = guest
    ? updateGuestAction.bind(null, eventId, guest.id)
    : createGuestAction.bind(null, eventId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError message={state.error} />

      <FormField
        label="Nama tamu"
        name="name"
        type="text"
        placeholder="Ayu Lestari"
        required
        defaultValue={guest?.name}
        error={state.fieldErrors?.name?.[0]}
      />

      <FormField
        label="Nomor telepon"
        name="phone"
        type="tel"
        placeholder="0812-3456-7890"
        defaultValue={guest?.phone ?? ""}
        hint="Opsional. Boleh dikosongkan jika belum ada."
        error={state.fieldErrors?.phone?.[0]}
      />

      <FormField
        label="Email"
        name="email"
        type="email"
        placeholder="ayu@example.com"
        defaultValue={guest?.email ?? ""}
        hint="Opsional."
        error={state.fieldErrors?.email?.[0]}
      />

      <GuestCategoryField defaultValue={guest?.category} error={state.fieldErrors?.category?.[0]} />

      <FormField
        label="Kuota kursi"
        name="seatQuota"
        type="number"
        min={1}
        max={20}
        defaultValue={guest?.seatQuota ?? 1}
        required
        error={state.fieldErrors?.seatQuota?.[0]}
      />

      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm leading-none font-medium">
          Catatan
        </label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Mis. alergi makanan, kebutuhan khusus, dll."
          defaultValue={guest?.notes ?? ""}
          aria-invalid={!!state.fieldErrors?.notes?.[0]}
        />
        {state.fieldErrors?.notes?.[0] && (
          <p className="text-destructive text-xs">{state.fieldErrors.notes[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : guest ? "Simpan Perubahan" : "Tambah Tamu"}
      </Button>
    </form>
  );
}
