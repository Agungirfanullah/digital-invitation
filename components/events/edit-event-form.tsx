"use client";

import { useActionState } from "react";

import { updateEventAction, type EventFormState } from "@/lib/events/actions";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";
import { EventTypeField } from "@/components/events/event-type-field";
import { EventDescriptionField } from "@/components/events/event-description-field";
import { Button } from "@/components/ui/button";

const initialState: EventFormState = {};

interface EditEventFormProps {
  eventId: string;
  defaultValues: {
    title: string;
    type: string;
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

      <EventTypeField defaultValue={defaultValues.type} error={state.fieldErrors?.type?.[0]} />

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
