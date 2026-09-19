"use client";

import { useActionState, useState } from "react";
import type { RSVPAttendance } from "@prisma/client";

import { submitRsvpAction } from "@/lib/rsvp/actions";
import { RSVP_ATTENDANCE_LABELS, RSVP_ATTENDANCE_OPTIONS } from "@/lib/rsvp/labels";
import type { RsvpAnswer, RsvpFormState } from "@/lib/rsvp/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: RsvpFormState = { status: "idle" };

export interface RsvpFormProps {
  eventId: string;
  token: string;
  guestName: string;
  seatQuota: number;
  existing: RsvpAnswer | null;
}

/**
 * Always renders the (editable) form rather than switching to a separate
 * read-only confirmation view after submitting — the just-submitted
 * values are already what's showing in the fields (the browser doesn't
 * reset them on a Server Action call), so a success banner on top is
 * enough to confirm the answer while keeping it immediately editable
 * again, matching "existing RSVP is editable by the same guest."
 */
export function RsvpForm({ eventId, token, guestName, seatQuota, existing }: RsvpFormProps) {
  const action = submitRsvpAction.bind(null, eventId, token);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [attendance, setAttendance] = useState<RSVPAttendance | "">(existing?.attendance ?? "");
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-5 rounded-lg border p-5" noValidate>
      <div>
        <h3 className="text-lg font-medium">Apakah Anda akan hadir?</h3>
        <p className="mt-1 text-sm opacity-80">
          Halo {guestName}, mohon konfirmasi kehadiran Anda di bawah ini.
        </p>
      </div>

      {state.status === "success" && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Terima kasih! Jawaban RSVP Anda ({RSVP_ATTENDANCE_LABELS[state.data.attendance]}) telah
          kami terima. Anda dapat memperbarui jawaban ini kapan saja.
        </p>
      )}

      {state.status === "error" && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="sr-only">Pilih jawaban kehadiran</legend>
        {RSVP_ATTENDANCE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm has-[:checked]:border-current"
          >
            <input
              type="radio"
              name="attendance"
              value={option.value}
              defaultChecked={existing?.attendance === option.value}
              onChange={() => setAttendance(option.value)}
              className="size-4"
              required
            />
            {option.label}
          </label>
        ))}
        {fieldErrors?.attendance?.[0] && (
          <p className="text-destructive text-xs">{fieldErrors.attendance[0]}</p>
        )}
      </fieldset>

      {attendance === "ATTENDING" && (
        <div className="space-y-1.5">
          <label htmlFor="attendeeCount" className="text-sm font-medium">
            Jumlah tamu yang hadir
          </label>
          <input
            id="attendeeCount"
            name="attendeeCount"
            type="number"
            min={1}
            max={seatQuota}
            defaultValue={existing?.attendeeCount ?? 1}
            className="border-input flex h-9 w-24 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm"
            aria-invalid={!!fieldErrors?.attendeeCount?.[0]}
            aria-describedby="attendeeCount-hint"
          />
          <p id="attendeeCount-hint" className="text-xs opacity-70">
            Kuota kursi Anda: maksimal {seatQuota} orang.
          </p>
          {fieldErrors?.attendeeCount?.[0] && (
            <p className="text-destructive text-xs">{fieldErrors.attendeeCount[0]}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-medium">
          Pesan untuk tuan rumah (opsional)
        </label>
        <Textarea
          id="message"
          name="message"
          rows={3}
          defaultValue={existing?.message ?? ""}
          placeholder="Tuliskan pesan atau catatan tambahan..."
          aria-invalid={!!fieldErrors?.message?.[0]}
        />
        {fieldErrors?.message?.[0] && (
          <p className="text-destructive text-xs">{fieldErrors.message[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Mengirim..." : existing ? "Perbarui RSVP" : "Kirim RSVP"}
      </Button>
    </form>
  );
}
