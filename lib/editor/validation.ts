import { z } from "zod";

import { isSafeHttpUrl } from "@/lib/invitations/url-safety";

/**
 * Editor mutations are called as plain Server Actions with typed JS
 * objects (not `<form>`+`FormData` like the auth/event forms), so the
 * client is expected to normalize an empty input to `null` before
 * calling — these schemas validate `string | null`, not `string | ""`.
 */
function nullableString(max: number, message?: string) {
  return z.string().trim().min(1, message).max(max, message).nullable();
}

const safeHttpUrl = (max: number, message = "URL harus berupa tautan http/https yang valid.") =>
  z.string().trim().max(max).refine(isSafeHttpUrl, message);

const nullableSafeHttpUrl = (max: number, message?: string) => safeHttpUrl(max, message).nullable();

export const weddingProfileSchema = z.object({
  brideFullName: nullableString(120, "Nama lengkap maksimal 120 karakter."),
  brideNickname: nullableString(60, "Nama panggilan maksimal 60 karakter."),
  brideFather: nullableString(120),
  brideMother: nullableString(120),
  brideInstagram: nullableString(60),
  groomFullName: nullableString(120, "Nama lengkap maksimal 120 karakter."),
  groomNickname: nullableString(60, "Nama panggilan maksimal 60 karakter."),
  groomFather: nullableString(120),
  groomMother: nullableString(120),
  groomInstagram: nullableString(60),
});

export type WeddingProfileInput = z.infer<typeof weddingProfileSchema>;

const colorField = z
  .string()
  .trim()
  .min(1, "Warna tidak boleh kosong.")
  .max(64, "Warna maksimal 64 karakter.")
  .regex(/^[a-zA-Z0-9#(),.%\-\s]+$/, "Format warna tidak valid.")
  .nullable();

const fontField = nullableString(120, "Nama font maksimal 120 karakter.");

export const themeSchema = z.object({
  primaryColor: colorField,
  secondaryColor: colorField,
  backgroundColor: colorField,
  textColor: colorField,
  accentColor: colorField,
  headingFont: fontField,
  bodyFont: fontField,
  scriptFont: fontField,
  backgroundImageUrl: nullableSafeHttpUrl(500, "URL gambar latar tidak valid."),
});

export type ThemeInput = z.infer<typeof themeSchema>;

export const templateSelectionSchema = z.object({
  templateSlug: z.string().trim().min(1).max(80).nullable(),
});

export type TemplateSelectionInput = z.infer<typeof templateSelectionSchema>;

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.");

const timeOnlySchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Waktu tidak valid (gunakan format JJ:MM).");

export interface VenueInput {
  name: string;
  address: string;
  mapUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ScheduleInput {
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  venue: VenueInput | null;
}

/**
 * Flat fields, not a nested `venue` object — `ZodError.flatten()` only
 * reports field errors one level deep (keyed by `issue.path[0]`), so a
 * nested schema would collapse every venue error under one opaque
 * "venue" key instead of e.g. `venueAddress`, which the form can't map
 * back to the right input. Reconstructed into `ScheduleInput`'s nested
 * shape by `toScheduleInput()` after validation, so `lib/editor/service.ts`
 * (and its Prisma calls) never need to know about this flattening.
 */
export const scheduleFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Judul acara wajib diisi.")
      .max(150, "Judul maksimal 150 karakter."),
    description: nullableString(500, "Catatan maksimal 500 karakter."),
    date: dateOnlySchema,
    startTime: timeOnlySchema,
    endTime: timeOnlySchema,
    venueName: nullableString(150, "Nama lokasi maksimal 150 karakter."),
    venueAddress: nullableString(500, "Alamat maksimal 500 karakter."),
    venueMapUrl: nullableSafeHttpUrl(500, "URL peta tidak valid."),
    venueLatitude: z.number().min(-90).max(90).nullable(),
    venueLongitude: z.number().min(-180).max(180).nullable(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Waktu selesai harus setelah waktu mulai.",
    path: ["endTime"],
  })
  .refine((data) => (data.venueName === null) === (data.venueAddress === null), {
    message: "Nama dan alamat lokasi harus diisi bersamaan.",
    path: ["venueAddress"],
  });

export type ScheduleFormInput = z.infer<typeof scheduleFormSchema>;

export function toScheduleInput(form: ScheduleFormInput): ScheduleInput {
  return {
    title: form.title,
    description: form.description,
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    venue:
      form.venueName && form.venueAddress
        ? {
            name: form.venueName,
            address: form.venueAddress,
            mapUrl: form.venueMapUrl,
            latitude: form.venueLatitude,
            longitude: form.venueLongitude,
          }
        : null,
  };
}

export const loveStoryTitleSchema = z.object({
  title: nullableString(150, "Judul maksimal 150 karakter."),
});

export const loveStoryItemSchema = z.object({
  dateLabel: nullableString(40, "Label tanggal maksimal 40 karakter."),
  title: z.string().trim().min(1, "Judul wajib diisi.").max(150, "Judul maksimal 150 karakter."),
  description: nullableString(1000, "Deskripsi maksimal 1000 karakter."),
  imageUrl: nullableSafeHttpUrl(500, "URL gambar tidak valid."),
});

export type LoveStoryItemInput = z.infer<typeof loveStoryItemSchema>;

/**
 * URL-based gallery items are video-only as of Phase 11 — an image item
 * is always created through the real upload path
 * (lib/storage/validation.ts's `validateGalleryImageUpload`), never a
 * pasted URL. `type` is a fixed literal (not `z.enum(["IMAGE","VIDEO"])`
 * as it was pre-Phase-11) so this schema can never be used to create an
 * IMAGE row without going through upload validation.
 */
export const galleryVideoItemSchema = z.object({
  type: z.literal("VIDEO"),
  url: safeHttpUrl(500, "URL wajib berupa tautan http/https yang valid."),
  caption: nullableString(200, "Keterangan maksimal 200 karakter."),
});

export type GalleryVideoItemInput = z.infer<typeof galleryVideoItemSchema>;

/** Caption-only edit — the one mutation shared by IMAGE and VIDEO items after creation (replacing an image's file means delete + re-upload, not an in-place edit). */
export const galleryCaptionSchema = z.object({
  caption: nullableString(200, "Keterangan maksimal 200 karakter."),
});

export type GalleryCaptionInput = z.infer<typeof galleryCaptionSchema>;
