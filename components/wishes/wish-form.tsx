"use client";

import { useActionState, useState } from "react";

import { submitWishAction } from "@/lib/wishes/actions";
import type { WishFormState } from "@/lib/wishes/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState: WishFormState = { status: "idle" };

export interface WishFormProps {
  eventId: string;
  token: string;
  guestName: string;
}

/**
 * Remounts itself (via `formKey`) after a successful submit, clearing the
 * uncontrolled inputs back to their defaults. Each submit creates an
 * independent new `Wish` row (unlike RSVP's upsert-by-guest), so leaving
 * stale text in place would make a second accidental click send a
 * duplicate wish rather than "update" the same one.
 *
 * The key bump happens during render (comparing against the previous
 * `state` reference), not inside a `useEffect` — React's recommended
 * "adjusting state during render" pattern, which avoids the extra
 * post-commit render a `useEffect`-based setState would trigger.
 */
export function WishForm({ eventId, token, guestName }: WishFormProps) {
  const action = submitWishAction.bind(null, eventId, token);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [formKey, setFormKey] = useState(0);
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.status === "success") setFormKey((key) => key + 1);
  }

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form key={formKey} action={formAction} className="space-y-4 rounded-lg border p-5" noValidate>
      <div>
        <h3 className="text-lg font-medium">Kirim Ucapan &amp; Doa</h3>
        <p className="mt-1 text-sm opacity-80">Tuliskan ucapan Anda untuk tuan rumah.</p>
      </div>

      {state.status === "success" && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Terima kasih! Ucapan Anda telah kami terima dan akan tampil setelah disetujui tuan rumah.
        </p>
      )}

      {state.status === "error" && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="wish-name" className="text-sm font-medium">
          Nama
        </label>
        <Input
          id="wish-name"
          name="name"
          defaultValue={guestName}
          maxLength={100}
          required
          aria-invalid={!!fieldErrors?.name?.[0]}
        />
        {fieldErrors?.name?.[0] && (
          <p className="text-destructive text-xs">{fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="wish-message" className="text-sm font-medium">
          Ucapan
        </label>
        <Textarea
          id="wish-message"
          name="message"
          rows={3}
          maxLength={500}
          placeholder="Tuliskan ucapan dan doa Anda..."
          required
          aria-invalid={!!fieldErrors?.message?.[0]}
        />
        {fieldErrors?.message?.[0] && (
          <p className="text-destructive text-xs">{fieldErrors.message[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Mengirim..." : "Kirim Ucapan"}
      </Button>
    </form>
  );
}
