import type { RSVPAttendance } from "@prisma/client";

export const RSVP_ATTENDANCE_LABELS: Record<RSVPAttendance, string> = {
  ATTENDING: "Hadir",
  NOT_ATTENDING: "Tidak Hadir",
  MAYBE: "Belum Pasti",
};

export const RSVP_PENDING_LABEL = "Belum Mengisi RSVP";

/** Exact copy from docs/PRD.md §21 — do not reword without updating the PRD. */
export const RSVP_ATTENDANCE_OPTIONS: { value: RSVPAttendance; label: string }[] = [
  { value: "ATTENDING", label: "Ya, saya akan hadir" },
  { value: "NOT_ATTENDING", label: "Maaf, saya tidak dapat hadir" },
  { value: "MAYBE", label: "Masih belum pasti" },
];
