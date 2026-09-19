"use client";

import { useActionState, useState } from "react";
import { GiftMethodType } from "@prisma/client";

import {
  createGiftMethodAction,
  updateGiftMethodAction,
  type GiftMethodFormState,
} from "@/lib/gifts/actions";
import { GIFT_METHOD_FIELD_LABELS, GIFT_METHOD_TYPE_OPTIONS } from "@/lib/gifts/labels";
import type { GiftMethodListItem } from "@/lib/gifts/types";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const initialState: GiftMethodFormState = {};

export function GiftMethodForm({
  eventId,
  giftMethod,
}: {
  eventId: string;
  giftMethod?: GiftMethodListItem;
}) {
  const action = giftMethod
    ? updateGiftMethodAction.bind(null, eventId, giftMethod.id)
    : createGiftMethodAction.bind(null, eventId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState<GiftMethodType>(giftMethod?.type ?? GiftMethodType.BANK);
  const fieldLabels = GIFT_METHOD_FIELD_LABELS[type];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError message={state.error} />

      <div className="space-y-1.5">
        <label htmlFor="type" className="text-sm leading-none font-medium">
          Jenis Metode
        </label>
        <Select
          id="type"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as GiftMethodType)}
        >
          {GIFT_METHOD_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <FormField
        label={fieldLabels.providerName}
        name="providerName"
        type="text"
        placeholder={type === "OTHER" ? "Mis. Alamat Pengiriman Kado" : "Mis. BCA"}
        defaultValue={giftMethod?.providerName ?? ""}
        error={state.fieldErrors?.providerName?.[0]}
      />

      {type !== GiftMethodType.QR && (
        <>
          <FormField
            label={fieldLabels.accountName}
            name="accountName"
            type="text"
            placeholder="Mis. Budi Santoso"
            defaultValue={giftMethod?.accountName ?? ""}
            error={state.fieldErrors?.accountName?.[0]}
          />

          <FormField
            label={fieldLabels.accountNumber}
            name="accountNumber"
            type="text"
            placeholder={type === "OTHER" ? "0812-3456-7890" : "1234567890"}
            defaultValue={giftMethod?.accountNumber ?? ""}
            error={state.fieldErrors?.accountNumber?.[0]}
          />
        </>
      )}

      {type === GiftMethodType.QR && (
        <FormField
          label="URL Gambar QR"
          name="qrImageUrl"
          type="url"
          placeholder="https://..."
          defaultValue={giftMethod?.qrImageUrl ?? ""}
          hint="Tautan gambar kode QR (mis. QRIS) yang dapat diakses publik."
          error={state.fieldErrors?.qrImageUrl?.[0]}
        />
      )}

      <div className="space-y-1.5">
        <label htmlFor="instructions" className="text-sm leading-none font-medium">
          {fieldLabels.instructions}
        </label>
        <Textarea
          id="instructions"
          name="instructions"
          rows={3}
          placeholder={
            type === "OTHER"
              ? "Jl. Contoh No. 1, Jakarta. Mohon konfirmasi sebelum mengirim."
              : "Mis. mohon konfirmasi setelah transfer."
          }
          defaultValue={giftMethod?.instructions ?? ""}
          aria-invalid={!!state.fieldErrors?.instructions?.[0]}
        />
        {state.fieldErrors?.instructions?.[0] && (
          <p className="text-destructive text-xs">{state.fieldErrors.instructions[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={giftMethod?.isActive ?? true}
          className="border-input h-4 w-4 rounded"
        />
        <label htmlFor="isActive" className="text-sm leading-none">
          Tampilkan di undangan publik
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : giftMethod ? "Simpan Perubahan" : "Tambah Metode"}
      </Button>
    </form>
  );
}
