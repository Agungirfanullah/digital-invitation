"use client";

import { useActionState, useState } from "react";

import { deleteEventAction, type EventFormState } from "@/lib/events/actions";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";

const initialState: EventFormState = {};

export function DeleteEventButton({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const action = deleteEventAction.bind(null, eventId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!confirming) {
    return (
      <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
        Hapus Acara
      </Button>
    );
  }

  return (
    <div className="border-destructive/30 space-y-3 rounded-md border p-4">
      <div>
        <p className="text-sm font-medium">Yakin ingin menghapus &ldquo;{eventTitle}&rdquo;?</p>
        <p className="text-muted-foreground mt-1 text-xs">Tindakan ini tidak dapat dibatalkan.</p>
      </div>

      <FormError message={state.error} />

      <div className="flex gap-2">
        <form action={formAction}>
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? "Menghapus..." : "Ya, hapus acara ini"}
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Batal
        </Button>
      </div>
    </div>
  );
}
