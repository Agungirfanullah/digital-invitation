import { CHECKIN_STATUS_LABELS } from "@/lib/checkin/labels";

export function CheckInStatusBadge({ isCheckedIn }: { isCheckedIn: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isCheckedIn ? "bg-green-100 text-green-800" : "bg-secondary text-secondary-foreground"
      }`}
    >
      {isCheckedIn ? CHECKIN_STATUS_LABELS.CHECKED_IN : CHECKIN_STATUS_LABELS.NOT_CHECKED_IN}
    </span>
  );
}
