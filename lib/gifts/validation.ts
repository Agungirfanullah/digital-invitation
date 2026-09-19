import { z } from "zod";
import { GiftMethodType } from "@prisma/client";

import { isSafeHttpUrl } from "@/lib/invitations/url-safety";

export const giftMethodTypeSchema = z.enum(GiftMethodType);

/**
 * Gift forms submit via `FormData` (like the guest forms), where a
 * missing/empty optional field arrives as `""` — normalize that to `null`
 * before running the inner string schema, matching every Prisma column
 * here being nullable rather than an empty string.
 */
function nullableTrimmed<T extends z.ZodType<string>>(inner: T) {
  return z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    inner.nullable(),
  );
}

const providerNameSchema = nullableTrimmed(z.string().trim().max(100, "Maksimal 100 karakter."));
const accountNameSchema = nullableTrimmed(z.string().trim().max(100, "Maksimal 100 karakter."));
// Loose format check only — Indonesian bank/e-wallet identifiers vary
// widely (digits, dashes, spaces, sometimes letters for an email-style
// e-wallet ID), so this only bounds length rather than forcing one shape.
const accountNumberSchema = nullableTrimmed(z.string().trim().max(100, "Maksimal 100 karakter."));
const instructionsSchema = nullableTrimmed(z.string().trim().max(1000, "Maksimal 1000 karakter."));
const qrImageUrlSchema = nullableTrimmed(
  z
    .string()
    .trim()
    .max(500)
    .refine(isSafeHttpUrl, "URL gambar QR harus berupa tautan http/https yang valid."),
);

const baseGiftMethodSchema = z.object({
  type: giftMethodTypeSchema,
  providerName: providerNameSchema,
  accountName: accountNameSchema,
  accountNumber: accountNumberSchema,
  qrImageUrl: qrImageUrlSchema,
  instructions: instructionsSchema,
  // Checkbox input: present as "on" when checked, absent (undefined) when
  // unchecked — never trust an arbitrary truthy string here.
  isActive: z.preprocess((value) => value === "on" || value === true, z.boolean()),
});

/**
 * `GiftMethod` has one fixed column set for every `type` (docs/DATABASE.md
 * §18) — this cross-field refine is what actually enforces "a bank
 * transfer method needs a bank name and account number" etc., rather than
 * leaving every column optional regardless of type.
 */
export const giftMethodInputSchema = baseGiftMethodSchema.superRefine((data, ctx) => {
  switch (data.type) {
    case GiftMethodType.BANK:
      if (!data.providerName) {
        ctx.addIssue({ code: "custom", path: ["providerName"], message: "Nama bank wajib diisi." });
      }
      if (!data.accountNumber) {
        ctx.addIssue({
          code: "custom",
          path: ["accountNumber"],
          message: "Nomor rekening wajib diisi.",
        });
      }
      break;
    case GiftMethodType.EWALLET:
      if (!data.providerName) {
        ctx.addIssue({
          code: "custom",
          path: ["providerName"],
          message: "Nama penyedia e-wallet wajib diisi.",
        });
      }
      if (!data.accountNumber) {
        ctx.addIssue({
          code: "custom",
          path: ["accountNumber"],
          message: "Nomor/ID akun wajib diisi.",
        });
      }
      break;
    case GiftMethodType.QR:
      if (!data.qrImageUrl) {
        ctx.addIssue({
          code: "custom",
          path: ["qrImageUrl"],
          message: "URL gambar QR wajib diisi.",
        });
      }
      break;
    case GiftMethodType.OTHER:
      if (!data.providerName) {
        ctx.addIssue({ code: "custom", path: ["providerName"], message: "Judul wajib diisi." });
      }
      if (!data.instructions) {
        ctx.addIssue({
          code: "custom",
          path: ["instructions"],
          message: "Instruksi atau alamat wajib diisi.",
        });
      }
      break;
  }
});

export type GiftMethodInput = z.infer<typeof giftMethodInputSchema>;
