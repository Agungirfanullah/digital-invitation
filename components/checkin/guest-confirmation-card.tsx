import type { CheckInGuestView } from "@/lib/checkin/types";
import { RSVP_ATTENDANCE_LABELS, RSVP_PENDING_LABEL } from "@/lib/rsvp/labels";
import { GUEST_CATEGORY_LABELS } from "@/lib/guests/labels";
import { CheckInStatusBadge } from "@/components/checkin/checkin-status-badge";
import { Button } from "@/components/ui/button";

/**
 * Shows exactly what docs/PRD.md §33 asks for — name, RSVP status, seat
 * quota, check-in status — and nothing else (no phone/email/notes/id).
 * Used both for the pre-confirm preview and the post-confirm result.
 */
export function GuestConfirmationCard({
  guest,
  onConfirm,
  onReset,
  confirmLabel,
  confirmPending,
  showConfirm,
  resetLabel,
}: {
  guest: CheckInGuestView;
  onConfirm?: () => void;
  onReset: () => void;
  confirmLabel?: string;
  confirmPending?: boolean;
  showConfirm: boolean;
  resetLabel: string;
}) {
  return (
    <div className="space-y-4 rounded-lg border p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-semibold">{guest.guestName}</p>
        <CheckInStatusBadge isCheckedIn={guest.isCheckedIn} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Kategori</dt>
          <dd className="mt-0.5">{GUEST_CATEGORY_LABELS[guest.category]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status RSVP</dt>
          <dd className="mt-0.5">
            {guest.rsvpAttendance
              ? RSVP_ATTENDANCE_LABELS[guest.rsvpAttendance]
              : RSVP_PENDING_LABEL}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kuota Kursi</dt>
          <dd className="mt-0.5">{guest.seatQuota}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {showConfirm && onConfirm && (
          <Button type="button" onClick={onConfirm} disabled={confirmPending} size="lg">
            {confirmPending ? "Memproses..." : (confirmLabel ?? "Konfirmasi Check-in")}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onReset} size="lg">
          {resetLabel}
        </Button>
      </div>
    </div>
  );
}
