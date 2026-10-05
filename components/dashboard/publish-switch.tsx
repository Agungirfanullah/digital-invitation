"use client";

import { useActionState } from "react";

import {
  publishEventAction,
  unpublishEventAction,
  type EventFormState,
} from "@/lib/events/actions";

const initialState: EventFormState = {};

/**
 * Publish / unpublish as an on-off switch. Same server actions (and the same
 * server-side readiness check) as the old button — a draft that isn't ready
 * simply stays off and shows why.
 */
export function PublishSwitch({ eventId, isPublished }: { eventId: string; isPublished: boolean }) {
  const action = (isPublished ? unpublishEventAction : publishEventAction).bind(null, eventId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-wide uppercase" aria-live="polite">
          {pending ? "Memproses..." : isPublished ? "Aktif" : "Draf"}
        </span>
        <button
          type="submit"
          role="switch"
          aria-checked={isPublished}
          aria-label="Publikasikan undangan"
          disabled={pending}
          className={`focus-visible:ring-offset-primary relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-white/40 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 disabled:opacity-60 ${
            isPublished ? "bg-white/90" : "bg-white/20"
          }`}
        >
          <span
            aria-hidden="true"
            className={`block size-4 rounded-full transition-transform ${
              isPublished ? "bg-primary translate-x-6" : "translate-x-1 bg-white"
            }`}
          />
        </button>
      </div>
      {state.error && (
        <p role="alert" className="bg-card text-destructive max-w-56 rounded-md px-2 py-1 text-xs">
          {state.error}
        </p>
      )}
    </form>
  );
}
