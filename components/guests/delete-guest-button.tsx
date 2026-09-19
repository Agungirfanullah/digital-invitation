"use client";

import { useActionState, useState } from "react";

import { deleteGuestAction, type GuestFormState } from "@/lib/guests/actions";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";

const initialState: GuestFormState = {};

export function DeleteGuestButton({
  eventId,
  guestId,
  guestName,
}: {
  eventId: string;
  guestId: string;
  guestName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const action = deleteGuestAction.bind(null, eventId, guestId);
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
        <span className="text-muted-foreground text-xs">Hapus &ldquo;{guestName}&rdquo;?</span>
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
