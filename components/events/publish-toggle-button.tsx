"use client";

import { useActionState } from "react";

import {
  publishEventAction,
  unpublishEventAction,
  type EventFormState,
} from "@/lib/events/actions";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";

const initialState: EventFormState = {};

export function PublishToggleButton({
  eventId,
  isPublished,
}: {
  eventId: string;
  isPublished: boolean;
}) {
  const action = (isPublished ? unpublishEventAction : publishEventAction).bind(null, eventId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="space-y-2">
      <FormError message={state.error} />
      <form action={formAction}>
        <Button type="submit" variant={isPublished ? "outline" : "default"} disabled={pending}>
          {pending
            ? isPublished
              ? "Membatalkan publikasi..."
              : "Mempublikasikan..."
            : isPublished
              ? "Batalkan Publikasi"
              : "Publikasikan Acara"}
        </Button>
      </form>
    </div>
  );
}
