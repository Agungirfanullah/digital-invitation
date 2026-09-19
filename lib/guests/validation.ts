import { z } from "zod";
import { GuestCategory } from "@prisma/client";

export const guestCategorySchema = z.enum(GuestCategory);

/**
 * Guest forms submit via `FormData` (like the event forms), where a
 * missing/empty optional field arrives as `""`. This normalizes that (and
 * `null`/`undefined`, for the CSV-import path which builds objects
 * directly) to `null` before running the inner string schema, so every
 * optional field ends up `string | null` — matching how the Prisma columns
 * are actually stored, never an empty string.
 */
function nullableTrimmed<T extends z.ZodType<string>>(inner: T) {
  return z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : value),
    inner.nullable(),
  );
}

const nameSchema = z
  .string()
  .trim()
  .min(2, "Nama minimal 2 karakter.")
  .max(120, "Nama maksimal 120 karakter.");

/**
 * Loose format check only — allows the common Indonesian formats
 * (`0812...`, `+62812...`, with spaces/dashes) without forcing a single
 * canonical shape. Duplicate comparison is handled separately by
 * `phoneDigits()` (lib/guests/normalize.ts), not by rewriting this value.
 */
const phoneSchema = nullableTrimmed(
  z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{6,20}$/, "Nomor telepon tidak valid."),
);

const emailSchema = nullableTrimmed(
  z
    .string()
    .trim()
    .max(254, "Email maksimal 254 karakter.")
    .pipe(z.email("Masukkan email yang valid.")),
);

const notesSchema = nullableTrimmed(z.string().trim().max(500, "Catatan maksimal 500 karakter."));

const seatQuotaSchema = z.coerce
  .number()
  .int("Kuota kursi harus bilangan bulat.")
  .min(1, "Kuota kursi minimal 1.")
  .max(20, "Kuota kursi maksimal 20.");

export const guestInputSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  category: guestCategorySchema,
  seatQuota: seatQuotaSchema,
  notes: notesSchema,
});

export type GuestInput = z.infer<typeof guestInputSchema>;

export const guestListQuerySchema = z.object({
  q: nullableTrimmed(z.string().trim().max(100)),
  category: z
    .union([guestCategorySchema, z.literal("ALL")])
    .catch("ALL" as const)
    .default("ALL"),
  sort: z
    .enum(["name_asc", "name_desc", "newest", "oldest"])
    .catch("newest" as const)
    .default("newest"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export type GuestListQueryInput = z.infer<typeof guestListQuerySchema>;

/** Same shape as `guestInputSchema`, minus the seat-quota default of 1 when a CSV cell is blank. */
export const guestCsvRowSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  category: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? "OTHER" : value),
    guestCategorySchema,
  ),
  seatQuota: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? 1 : value),
    seatQuotaSchema,
  ),
  notes: notesSchema,
});

export type GuestCsvRowInput = z.infer<typeof guestCsvRowSchema>;

export const MAX_CSV_ROWS = 500;
export const MAX_CSV_LENGTH = 200_000;
