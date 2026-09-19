import type { GuestCategory, GuestInvitationStatus } from "@prisma/client";

export const GUEST_CATEGORY_LABELS: Record<GuestCategory, string> = {
  FAMILY: "Keluarga",
  FRIEND: "Teman",
  COLLEAGUE: "Rekan Kerja",
  VIP: "VIP",
  OTHER: "Lainnya",
};

export const GUEST_CATEGORY_OPTIONS = Object.entries(GUEST_CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as GuestCategory, label }),
);

export const GUEST_INVITATION_STATUS_LABELS: Record<GuestInvitationStatus, string> = {
  NOT_SENT: "Belum dikirim",
  SENT: "Terkirim",
  OPENED: "Dibuka",
  RSVPED: "Sudah RSVP",
  CHECKED_IN: "Sudah Check-in",
};
