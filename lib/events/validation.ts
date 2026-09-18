import { z } from "zod";
import { EventType } from "@prisma/client";

export const eventTypeSchema = z.enum(EventType);

const title = z
  .string()
  .trim()
  .min(3, "Judul acara minimal 3 karakter.")
  .max(120, "Judul acara maksimal 120 karakter.");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug minimal 3 karakter.")
  .max(60, "Slug maksimal 60 karakter.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (tidak boleh diawali/diakhiri tanda hubung).",
  );

const description = z
  .string()
  .trim()
  .max(500, "Deskripsi maksimal 500 karakter.")
  .optional()
  .transform((value) => (value ? value : undefined));

export const createEventSchema = z.object({
  title,
  type: eventTypeSchema,
  slug: slugSchema,
  description,
});

export const updateEventSchema = createEventSchema;

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
