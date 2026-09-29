import { z } from "zod";

import { INVITATION_SECTION_KEYS } from "@/lib/event-types/sections";
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

const fullNameField = nullableString(120, "Nama lengkap maksimal 120 karakter.");
const nicknameField = nullableString(60, "Nama panggilan maksimal 60 karakter.");
const instagramField = nullableString(60, "Instagram maksimal 60 karakter.");

const nullableInt = (min: number, max: number, message: string) =>
  z.number({ error: message }).int(message).min(min, message).max(max, message).nullable();

/**
 * Identity profile schemas, one per identity family (docs/PRD.md §13–§13.7).
 * Every field is optional here on purpose: the editor autosaves partial
 * drafts. Required identity information is enforced at publish time by
 * `getMissingPublishRequirements()` (lib/event-types/identity.ts).
 */
export const coupleIdentitySchema = z.object({
  brideFullName: fullNameField,
  brideNickname: nicknameField,
  brideFather: nullableString(120),
  brideMother: nullableString(120),
  brideInstagram: instagramField,
  groomFullName: fullNameField,
  groomNickname: nicknameField,
  groomFather: nullableString(120),
  groomMother: nullableString(120),
  groomInstagram: instagramField,
  yearsTogether: nullableInt(1, 100, "Jumlah tahun harus antara 1 dan 100."),
});

export const personIdentitySchema = z.object({
  fullName: fullNameField,
  nickname: nicknameField,
  age: nullableInt(0, 150, "Usia harus antara 0 dan 150."),
  milestone: nullableString(120, "Keterangan maksimal 120 karakter."),
  hostedBy: nullableString(120, "Nama penyelenggara maksimal 120 karakter."),
  instagram: instagramField,
});

export const babyFamilyIdentitySchema = z.object({
  babyFullName: fullNameField,
  babyNickname: nicknameField,
  fatherName: nullableString(120, "Nama ayah maksimal 120 karakter."),
  motherName: nullableString(120, "Nama ibu maksimal 120 karakter."),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir tidak valid.")
    .refine(
      (value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
      "Tanggal lahir tidak valid.",
    )
    .nullable(),
  birthDetails: nullableString(200, "Keterangan maksimal 200 karakter."),
});

export const hostIdentitySchema = z.object({
  hostName: nullableString(120, "Nama tuan rumah maksimal 120 karakter."),
  occasionTheme: nullableString(120, "Tema maksimal 120 karakter."),
  contactInfo: nullableString(120, "Kontak maksimal 120 karakter."),
});

export const organizationIdentitySchema = z.object({
  organizationName: nullableString(150, "Nama organisasi maksimal 150 karakter."),
  contactPerson: nullableString(120, "Narahubung maksimal 120 karakter."),
  dressCode: nullableString(120, "Dress code maksimal 120 karakter."),
});

export const IDENTITY_SCHEMAS = {
  COUPLE: coupleIdentitySchema,
  PERSON: personIdentitySchema,
  BABY_FAMILY: babyFamilyIdentitySchema,
  HOST_GROUP: hostIdentitySchema,
  ORGANIZATION: organizationIdentitySchema,
} as const;

/** Families that can be written. GENERIC (OTHER) has no profile, so it is not accepted at all. */
export const writableIdentityFamilySchema = z.enum([
  "COUPLE",
  "PERSON",
  "BABY_FAMILY",
  "HOST_GROUP",
  "ORGANIZATION",
]);

export type CoupleIdentityInput = z.infer<typeof coupleIdentitySchema>;
export type PersonIdentityInput = z.infer<typeof personIdentitySchema>;
export type BabyFamilyIdentityInput = z.infer<typeof babyFamilyIdentitySchema>;
export type HostIdentityInput = z.infer<typeof hostIdentitySchema>;
export type OrganizationIdentityInput = z.infer<typeof organizationIdentitySchema>;

export type IdentityProfileInput =
  | { family: "COUPLE"; data: CoupleIdentityInput }
  | { family: "PERSON"; data: PersonIdentityInput }
  | { family: "BABY_FAMILY"; data: BabyFamilyIdentityInput }
  | { family: "HOST_GROUP"; data: HostIdentityInput }
  | { family: "ORGANIZATION"; data: OrganizationIdentityInput };

export type IdentityParseResult =
  { ok: true; value: IdentityProfileInput } | { ok: false; fieldErrors: Record<string, string[]> };

/**
 * Two-step parse of `{ family, data }`: the family first, then `data`
 * against that family's schema — so field errors stay keyed by field name
 * (`ZodError.flatten()` only reports one level deep) for the form to map
 * back. Whether the family matches the event's type is checked by the
 * service, which is the only place that knows the stored type.
 */
export function parseIdentityProfileInput(input: unknown): IdentityParseResult {
  const envelope = z
    .object({ family: writableIdentityFamilySchema, data: z.unknown() })
    .safeParse(input);
  if (!envelope.success) {
    return { ok: false, fieldErrors: { family: ["Jenis identitas tidak valid."] } };
  }

  const { family, data } = envelope.data;
  const parsed = IDENTITY_SCHEMAS[family].safeParse(data);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  return { ok: true, value: { family, data: parsed.data } as IdentityProfileInput };
}

/**
 * Owner section overrides: known keys only, boolean values only.
 *
 * `hero` was missing here from D-064 until this fix (D-067's own
 * inspection step found it): `.strict()` rejected any request containing
 * `hero`, even though `lib/event-types/sections.ts` and the editor UI
 * already treated it as a normal toggleable key end to end. No caller
 * ever exercised the gap because no existing test submitted `hero`
 * specifically through this schema.
 */
export const sectionOverridesSchema = z
  .object({
    hero: z.boolean(),
    identity: z.boolean(),
    schedule: z.boolean(),
    story: z.boolean(),
    gallery: z.boolean(),
    rsvp: z.boolean(),
    gift: z.boolean(),
    wishes: z.boolean(),
  })
  .partial()
  .strict();

/** A single up/down move of one configurable section (docs/PRD.md §15 "Reorder"). Closing is never a valid `key` — it has no `InvitationSectionKey` value. */
export const sectionMoveSchema = z.object({
  key: z.enum(INVITATION_SECTION_KEYS),
  direction: z.enum(["up", "down"]),
});

export type SectionMoveInput = z.infer<typeof sectionMoveSchema>;

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
