export const CHECKIN_STATUS_LABELS = {
  CHECKED_IN: "Sudah Check-in",
  NOT_CHECKED_IN: "Belum Check-in",
} as const;

/** Exact copy the reception UI shows for each outcome — see docs/PRD.md §33/§34 and this phase's spec. */
export const CHECKIN_OUTCOME_MESSAGES = {
  SUCCESS: "Berhasil check-in",
  ALREADY_CHECKED_IN: "Sudah check-in",
  INVALID_GUEST: "Tamu tidak ditemukan",
  QR_INVALID: "Kode QR tidak valid",
} as const;
