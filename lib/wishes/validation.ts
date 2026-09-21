import { z } from "zod";
import { WishStatus } from "@prisma/client";

import { guestTokenSchema } from "@/lib/invitations/token";

/** Reused as-is — the format check a public invitation token must pass is identical regardless of which feature resolves it. */
export { guestTokenSchema as wishTokenSchema };

export const wishFormSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Nama maksimal 100 karakter."),
  message: z
    .string()
    .trim()
    .min(1, "Ucapan wajib diisi.")
    .max(500, "Ucapan maksimal 500 karakter."),
});

export type WishFormInput = z.infer<typeof wishFormSchema>;

const wishStatusSchema = z.enum(WishStatus);

/** `ALL` is a dashboard-only filter concept, not a value of `WishStatus` itself — see lib/wishes/service.ts's buildWishFilter(). */
export const wishStatusFilterSchema = z.union([wishStatusSchema, z.literal("ALL")]);

export type WishStatusFilter = z.infer<typeof wishStatusFilterSchema>;

/**
 * Never errors on a malformed query string — every field falls back to a
 * safe default via `.catch()`, matching `lib/rsvp/validation.ts`'s
 * `rsvpDashboardQuerySchema` convention, since these values come directly
 * from the URL and must never be trusted at face value.
 */
export const wishModerationQuerySchema = z.object({
  status: wishStatusFilterSchema.catch("ALL").default("ALL"),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export type WishModerationQueryInput = z.infer<typeof wishModerationQuerySchema>;
