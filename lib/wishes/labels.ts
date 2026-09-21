import type { WishStatus } from "@prisma/client";

export const WISH_STATUS_LABELS: Record<WishStatus, string> = {
  PENDING: "Menunggu Moderasi",
  APPROVED: "Disetujui",
  HIDDEN: "Disembunyikan",
  DELETED: "Dihapus",
};

/**
 * The dashboard's status filter — `ALL` means "every non-deleted wish"
 * (see `buildWishFilter()` in lib/wishes/service.ts), not literally every
 * row; `DELETED` is its own explicit filter so a moderator can still see
 * what was removed if needed.
 */
export const WISH_STATUS_FILTER_OPTIONS: { value: "ALL" | WishStatus; label: string }[] = [
  { value: "ALL", label: "Semua (kecuali dihapus)" },
  { value: "PENDING", label: "Menunggu moderasi" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "HIDDEN", label: "Disembunyikan" },
  { value: "DELETED", label: "Dihapus" },
];
