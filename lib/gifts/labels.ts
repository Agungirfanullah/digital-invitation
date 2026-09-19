import type { GiftMethodType } from "@prisma/client";

export const GIFT_METHOD_TYPE_LABELS: Record<GiftMethodType, string> = {
  BANK: "Transfer Bank",
  EWALLET: "E-Wallet",
  QR: "QRIS / Kode QR",
  OTHER: "Lainnya",
};

export const GIFT_METHOD_TYPE_OPTIONS = Object.entries(GIFT_METHOD_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as GiftMethodType, label }),
);

/**
 * `GiftMethod` has one fixed set of columns shared by every type (see
 * docs/DATABASE.md §18) — there is no per-type schema. These labels give
 * each column a meaning appropriate to the selected type so the same
 * `providerName`/`accountName`/`accountNumber`/`instructions` fields read
 * naturally whether the method is a bank transfer or a physical gift
 * address, without a migration adding type-specific columns.
 */
export const GIFT_METHOD_FIELD_LABELS: Record<
  GiftMethodType,
  {
    providerName: string;
    accountName: string;
    accountNumber: string;
    instructions: string;
  }
> = {
  BANK: {
    providerName: "Nama Bank",
    accountName: "Nama Pemilik Rekening",
    accountNumber: "Nomor Rekening",
    instructions: "Catatan (opsional)",
  },
  EWALLET: {
    providerName: "Penyedia E-Wallet",
    accountName: "Nama Pemilik Akun",
    accountNumber: "Nomor / ID Akun",
    instructions: "Catatan (opsional)",
  },
  QR: {
    providerName: "Nama Penyedia (opsional)",
    accountName: "Nama Pemilik (opsional)",
    accountNumber: "Nomor / ID Akun (opsional)",
    instructions: "Catatan (opsional)",
  },
  OTHER: {
    providerName: "Judul",
    accountName: "Nama Penerima (opsional)",
    accountNumber: "Kontak / Telepon (opsional)",
    instructions: "Instruksi atau Alamat Pengiriman",
  },
};
