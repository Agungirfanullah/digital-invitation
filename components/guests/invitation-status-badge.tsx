import type { GuestInvitationStatus } from "@prisma/client";

import { GUEST_INVITATION_STATUS_LABELS } from "@/lib/guests/labels";

const STATUS_STYLE: Record<GuestInvitationStatus, string> = {
  NOT_SENT: "bg-secondary text-secondary-foreground",
  SENT: "bg-blue-100 text-blue-800",
  OPENED: "bg-purple-100 text-purple-800",
  RSVPED: "bg-green-100 text-green-800",
  CHECKED_IN: "bg-emerald-100 text-emerald-800",
};

export function InvitationStatusBadge({ status }: { status: GuestInvitationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {GUEST_INVITATION_STATUS_LABELS[status]}
    </span>
  );
}
