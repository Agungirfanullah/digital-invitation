import { z } from "zod";

import { dateOnlySchema } from "@/lib/editor/validation";
import { eventTitleSchema, eventTypeSchema } from "@/lib/events/validation";

/**
 * D-071 Onboarding MVP (docs/PRD.md §10). Reuses the existing per-family
 * identity contract (lib/editor/validation.ts's IDENTITY_SCHEMAS) — this
 * schema only validates the minimal "name(s)" onboarding actually asks for;
 * `lib/onboarding/service.ts` expands it into the full, existing
 * `IdentityProfileInput` shape (unset fields as `null`) before calling
 * `updateIdentityProfile()`, so no parallel identity model is introduced.
 *
 * `family` is never read from the client as a standalone field — the
 * server always derives it from the submitted, schema-validated `type` via
 * `EVENT_TYPE_CONFIG[type].family` (see lib/onboarding/service.ts), the
 * same trust boundary `updateIdentityProfile()` itself already enforces.
 * It only appears here as the discriminant of the union so each family's
 * name field(s) can be validated with the right shape.
 */
const nameField = z
  .string()
  .trim()
  .min(1, "Nama wajib diisi.")
  .max(120, "Nama maksimal 120 karakter.");

export const onboardingIdentitySchema = z.discriminatedUnion("family", [
  z.object({ family: z.literal("COUPLE"), firstName: nameField, secondName: nameField }),
  z.object({ family: z.literal("PERSON"), name: nameField }),
  z.object({ family: z.literal("BABY_FAMILY"), name: nameField }),
  z.object({ family: z.literal("HOST_GROUP"), name: nameField }),
  z.object({ family: z.literal("ORGANIZATION"), name: nameField }),
  // GENERIC (OTHER) has no identity profile at all (docs/PRD.md §13.7) —
  // no name field is collected or accepted for it.
  z.object({ family: z.literal("GENERIC") }),
]);

export type OnboardingIdentityInput = z.infer<typeof onboardingIdentitySchema>;

export const onboardingSchema = z.object({
  type: eventTypeSchema,
  title: eventTitleSchema,
  date: dateOnlySchema,
  identity: onboardingIdentitySchema,
  templateSlug: z.string().trim().min(1, "Pilih salah satu template.").max(80),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
