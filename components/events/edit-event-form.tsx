"use client";

import { useActionState } from "react";
import type { EventType } from "@prisma/client";

import { updateEventAction, type EventFormState } from "@/lib/events/actions";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";
import { EventDescriptionField } from "@/components/events/event-description-field";
import { Button } from "@/components/ui/button";

const initialState: EventFormState = {};

interface EditEventFormProps {
  eventId: string;
  defaultValues: {
    title: string;
    type: EventType;
    slug: string;
    description: string | null;
  };
}

export function EditEventForm({ eventId, defaultValues }: EditEventFormProps) {
  const action = updateEventAction.bind(null, eventId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError message={state.error} />

      <FormField
        label="Judul acara"
        name="title"
        type="text"
        required
        defaultValue={defaultValues.title}
        error={state.fieldErrors?.title?.[0]}
      />

      {/* Read-only on purpose — EventType is immutable after creation and
          enforced server-side (lib/events/service.ts), not just hidden here. */}
      <div className="space-y-1.5">
        <p className="text-sm leading-none font-medium">Jenis acara</p>
        <p className="text-sm">{EVENT_TYPE_LABELS[defaultValues.type]}</p>
        <p className="text-muted-foreground text-xs">
          Jenis acara tidak dapat diubah setelah acara dibuat.
        </p>
      </div>

      <FormField
        label="Slug undangan"
        name="slug"
        type="text"
        required
        defaultValue={defaultValues.slug}
        hint="Mengubah slug akan mengubah tautan undangan yang sudah dibagikan."
        error={state.fieldErrors?.slug?.[0]}
      />

      <EventDescriptionField
        defaultValue={defaultValues.description ?? undefined}
        error={state.fieldErrors?.description?.[0]}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
