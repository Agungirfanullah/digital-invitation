"use client";

import { useActionState, useState } from "react";
import type { WishStatus } from "@prisma/client";

import { approveWishAction, deleteWishAction, hideWishAction } from "@/lib/wishes/actions";
import type { WishModerationFormState } from "@/lib/wishes/actions";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";

const initialState: WishModerationFormState = {};

/**
 * All three actions are always bound and called unconditionally (rules of
 * hooks) — which buttons actually render is decided by `status` below.
 * `DELETED` is a terminal state (docs/DECISIONS.md D-038): no further
 * moderation action is offered once a wish is soft-deleted.
 */
export function ModerateWishButtons({
  eventId,
  wishId,
  status,
}: {
  eventId: string;
  wishId: string;
  status: WishStatus;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const approveAction = approveWishAction.bind(null, eventId, wishId);
  const [approveState, approveFormAction, approvePending] = useActionState(
    approveAction,
    initialState,
  );

  const hideAction = hideWishAction.bind(null, eventId, wishId);
  const [hideState, hideFormAction, hidePending] = useActionState(hideAction, initialState);

  const deleteAction = deleteWishAction.bind(null, eventId, wishId);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteAction, initialState);

  if (status === "DELETED") return null;

  const error = approveState.error ?? hideState.error ?? deleteState.error;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <FormError message={error} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status !== "APPROVED" && (
          <form action={approveFormAction}>
            <Button type="submit" size="sm" disabled={approvePending}>
              {approvePending ? "Menyetujui..." : "Setujui"}
            </Button>
          </form>
        )}
        {status !== "HIDDEN" && (
          <form action={hideFormAction}>
            <Button type="submit" variant="outline" size="sm" disabled={hidePending}>
              {hidePending ? "Menyembunyikan..." : "Sembunyikan"}
            </Button>
          </form>
        )}
        {!confirmingDelete ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)}>
            Hapus
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Hapus ucapan ini?</span>
            <form action={deleteFormAction}>
              <Button type="submit" variant="destructive" size="sm" disabled={deletePending}>
                {deletePending ? "Menghapus..." : "Ya, hapus"}
              </Button>
            </form>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
              disabled={deletePending}
            >
              Batal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
