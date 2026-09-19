"use client";

import { useActionState, useState } from "react";

import { regenerateInvitationTokenAction, type RegenerateTokenState } from "@/lib/guests/actions";
import { Button } from "@/components/ui/button";

const initialState: RegenerateTokenState = { status: "idle" };

/**
 * Two-step confirm, same pattern as `DeleteGuestButton` — regenerating
 * immediately breaks the old link for anyone who still has it, so it
 * shouldn't be a single accidental click.
 */
export function RegenerateTokenButton({ eventId, guestId }: { eventId: string; guestId: string }) {
  const [confirming, setConfirming] = useState(false);
  const action = regenerateInvitationTokenAction.bind(null, eventId, guestId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!confirming) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)}>
        Buat Ulang Tautan
      </Button>
    );
  }

  return (
    <div className="border-destructive/30 space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">Buat ulang tautan undangan?</p>
      <p className="text-muted-foreground text-xs">
        Tautan lama akan langsung berhenti berfungsi. Siapa pun yang masih menyimpan tautan lama
        tidak akan bisa membukanya lagi.
      </p>
      {state.status === "error" && (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Tautan baru berhasil dibuat.
        </p>
      )}
      <div className="flex gap-2">
        <form action={formAction}>
          <Button type="submit" variant="destructive" size="sm" disabled={pending}>
            {pending ? "Memproses..." : "Ya, buat ulang"}
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Tutup
        </Button>
      </div>
    </div>
  );
}
