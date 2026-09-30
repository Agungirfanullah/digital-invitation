"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAppUser } from "@/lib/auth/session";
import { EVENT_TYPE_CONFIG, type IdentityFamily } from "@/lib/event-types/config";
import { eventTypeSchema } from "@/lib/events/validation";
import { completeOnboarding } from "@/lib/onboarding/service";
import { mapOnboardingErrorMessage } from "@/lib/onboarding/errors";
import { onboardingSchema } from "@/lib/onboarding/validation";

export interface OnboardingActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * `type` decides which identity shape the rest of the submission must take
 * (docs/PRD.md §13-§13.7) — the client only ever sends the raw name
 * field(s) for whichever family the wizard showed; `family` itself is
 * never trusted from the client, it is re-derived here from the
 * server-validated `type`, the same trust boundary
 * `updateIdentityProfile()` already enforces.
 */
function buildIdentityInput(family: IdentityFamily, formData: FormData): unknown {
  const identityFirst = formData.get("identityFirst");
  const identitySecond = formData.get("identitySecond");

  switch (family) {
    case "COUPLE":
      return { family, firstName: identityFirst, secondName: identitySecond };
    case "GENERIC":
      return { family };
    default:
      return { family, name: identityFirst };
  }
}

export async function completeOnboardingAction(
  _prevState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const user = await requireAppUser();

  const typeParsed = eventTypeSchema.safeParse(formData.get("type"));
  if (!typeParsed.success) {
    return {
      error: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: { type: ["Jenis acara tidak valid."] },
    };
  }
  const family = EVENT_TYPE_CONFIG[typeParsed.data].family;

  const parsed = onboardingSchema.safeParse({
    type: typeParsed.data,
    title: formData.get("title"),
    date: formData.get("date"),
    identity: buildIdentityInput(family, formData),
    templateSlug: formData.get("templateSlug"),
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let result: Awaited<ReturnType<typeof completeOnboarding>>;
  try {
    result = await completeOnboarding(user.id, parsed.data);
  } catch (error) {
    return { error: mapOnboardingErrorMessage(error) };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/events/${result.eventId}/editor`);
}
