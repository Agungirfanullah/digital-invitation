import type { EventStatus, EventType } from "@prisma/client";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  WEDDING: "Pernikahan",
  ENGAGEMENT: "Lamaran",
  BIRTHDAY: "Ulang Tahun",
  AQIQAH: "Aqiqah",
  ANNIVERSARY: "Anniversary",
  GATHERING: "Kumpul Bersama",
  CORPORATE: "Acara Korporat",
  OTHER: "Lainnya",
};

export const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
  value: value as EventType,
  label,
}));

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Draf",
  PUBLISHED: "Dipublikasikan",
  ARCHIVED: "Diarsipkan",
};
