"use client";

import { useActionState, useState } from "react";

import { createEventAction, type EventFormState } from "@/lib/events/actions";
import { slugify } from "@/lib/events/slug";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";
import { EventTypeField } from "@/components/events/event-type-field";
import { EventDescriptionField } from "@/components/events/event-description-field";
import { Button } from "@/components/ui/button";

const initialState: EventFormState = {};

export function CreateEventForm() {
  const [state, formAction, pending] = useActionState(createEventAction, initialState);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError message={state.error} />

      <FormField
        label="Judul acara"
        name="title"
        type="text"
        placeholder="Pernikahan Raka & Nadia"
        required
        error={state.fieldErrors?.title?.[0]}
        onChange={(event) => {
          if (!slugTouched) setSlug(slugify(event.target.value));
        }}
      />

      <EventTypeField error={state.fieldErrors?.type?.[0]} />

      <FormField
        label="Slug undangan"
        name="slug"
        type="text"
        required
        value={slug}
        hint="Digunakan pada tautan undangan, misalnya: /invite/raka-dan-nadia"
        error={state.fieldErrors?.slug?.[0]}
        onChange={(event) => {
          setSlugTouched(true);
          setSlug(event.target.value);
        }}
      />

      <EventDescriptionField error={state.fieldErrors?.description?.[0]} />

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Buat Acara"}
      </Button>
    </form>
  );
}
