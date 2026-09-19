"use client";

import { useActionState, useState } from "react";

import { deleteGiftMethodAction, type GiftMethodFormState } from "@/lib/gifts/actions";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";

const initialState: GiftMethodFormState = {};

export function DeleteGiftMethodButton({
  eventId,
  giftMethodId,
  label,
}: {
  eventId: string;
  giftMethodId: string;
  label: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const action = deleteGiftMethodAction.bind(null, eventId, giftMethodId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Hapus
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <FormError message={state.error} />
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Hapus &ldquo;{label}&rdquo;?</span>
        <form action={formAction}>
          <Button type="submit" variant="destructive" size="sm" disabled={pending}>
            {pending ? "Menghapus..." : "Ya, hapus"}
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Batal
        </Button>
      </div>
    </div>
  );
}
