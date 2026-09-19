import { z } from "zod";
import { GuestCategory, RSVPAttendance } from "@prisma/client";

import { guestTokenSchema } from "@/lib/invitations/token";

/** Reused as-is — the format check a public invitation token must pass is identical regardless of which feature resolves it. */
export { guestTokenSchema as rsvpTokenSchema };

export const rsvpAttendanceSchema = z.enum(RSVPAttendance);

/**
 * Structural validation only. The real business limit (`attendeeCount <=
 * guest.seatQuota`) depends on which specific guest is answering — that
 * isn't known until the token resolves, so it's enforced in
 * `lib/rsvp/service.ts`, not here. `50` is just a sanity ceiling against a
 * malformed payload reaching the database at all.
 */
export const rsvpFormSchema = z
  .object({
    attendance: rsvpAttendanceSchema,
    attendeeCount: z.coerce
      .number()
      .int("Jumlah tamu harus berupa angka bulat.")
      .min(0, "Jumlah tamu tidak valid.")
      .max(50, "Jumlah tamu tidak valid."),
    message: z
      .string()
      .trim()
      .max(500, "Pesan maksimal 500 karakter.")
      .nullable()
      .optional()
      .transform((value) => (value ? value : null)),
  })
  .refine((data) => data.attendance !== "ATTENDING" || data.attendeeCount >= 1, {
    message: "Jumlah tamu minimal 1 jika Anda akan hadir.",
    path: ["attendeeCount"],
  });

export type RsvpFormInput = z.infer<typeof rsvpFormSchema>;

/** `PENDING` means "no RSVP row yet" — not a value of `RSVPAttendance` itself, so it's a dashboard-only filter concept, not a second RSVP state machine. */
export const rsvpStatusFilterSchema = z.union([
  rsvpAttendanceSchema,
  z.literal("PENDING"),
  z.literal("ALL"),
]);

export type RsvpStatusFilter = z.infer<typeof rsvpStatusFilterSchema>;

const guestCategoryFilterSchema = z.union([z.enum(GuestCategory), z.literal("ALL")]);

/**
 * Never errors on a malformed query string — every field falls back to a
 * safe default via `.catch()`, matching `lib/guests/validation.ts`'s
 * `guestListQuerySchema` convention, since these values come directly
 * from the URL and must never be trusted at face value.
 */
export const rsvpDashboardQuerySchema = z.object({
  q: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.string().trim().max(100).optional(),
  ),
  status: rsvpStatusFilterSchema.catch("ALL").default("ALL"),
  category: guestCategoryFilterSchema.catch("ALL").default("ALL"),
  sort: z.enum(["name_asc", "name_desc"]).catch("name_asc").default("name_asc"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export type RsvpDashboardQueryInput = z.infer<typeof rsvpDashboardQuerySchema>;
