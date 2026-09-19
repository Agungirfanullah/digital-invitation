import type { RSVPAttendance } from "@prisma/client";

import { RSVP_ATTENDANCE_LABELS, RSVP_PENDING_LABEL } from "@/lib/rsvp/labels";

const ATTENDANCE_STYLE: Record<RSVPAttendance, string> = {
  ATTENDING: "bg-green-100 text-green-800",
  NOT_ATTENDING: "bg-red-100 text-red-800",
  MAYBE: "bg-amber-100 text-amber-800",
};

export function RsvpStatusBadge({ attendance }: { attendance: RSVPAttendance | null }) {
  if (!attendance) {
    return (
      <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
        {RSVP_PENDING_LABEL}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ATTENDANCE_STYLE[attendance]}`}
    >
      {RSVP_ATTENDANCE_LABELS[attendance]}
    </span>
  );
}
