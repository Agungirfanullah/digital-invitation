import "server-only";

import { IdentityFamilyMismatchError } from "@/lib/editor/errors";
import type { IdentityProfileInput } from "@/lib/editor/validation";
import { createSchedule, selectTemplate, updateIdentityProfile } from "@/lib/editor/service";
import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";
import { SlugConflictError } from "@/lib/events/errors";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { createEventForUser } from "@/lib/events/service";
import { slugify } from "@/lib/events/slug";
import type { OnboardingIdentityInput, OnboardingInput } from "@/lib/onboarding/validation";

/**
 * D-071 Onboarding MVP. Reasonable engineering defaults for the schedule
 * fields onboarding's single "Date" question doesn't collect
 * (docs/DECISIONS.md D-070 Product Decision Resolution Audit, PD-01 — not
 * a product decision: the resulting schedule remains fully editable in the
 * existing editor). No schema change, no new product decision.
 */
const DEFAULT_SCHEDULE_START = "08:00";
const DEFAULT_SCHEDULE_END = "10:00";

/** `createEventForUser()` requires a globally unique slug the onboarding UI never asks for (docs/DECISIONS.md D-070, PD-01/PD-02 context) — generated from the title via the existing `slugify()` helper, with a small numeric-suffix retry on collision. */
const MAX_SLUG_ATTEMPTS = 5;
const SLUG_FALLBACK_BASE = "acara";

function buildSlugCandidate(base: string, attempt: number): string {
  if (attempt === 0) return base;
  const suffix = `-${attempt + 1}`;
  // Strip a trailing hyphen the slice could otherwise leave right before
  // `suffix`, which would produce an invalid "foo--2" double hyphen.
  const truncatedBase = base.slice(0, 60 - suffix.length).replace(/-+$/, "");
  return `${truncatedBase}${suffix}`;
}

async function createEventWithGeneratedSlug(
  userId: string,
  title: string,
  type: OnboardingInput["type"],
) {
  const base = slugify(title) || SLUG_FALLBACK_BASE;
  const safeBase = base.length >= 3 ? base : SLUG_FALLBACK_BASE;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = buildSlugCandidate(safeBase, attempt);
    try {
      return await createEventForUser(userId, { title, type, slug, description: undefined });
    } catch (error) {
      const isLastAttempt = attempt === MAX_SLUG_ATTEMPTS - 1;
      if (!(error instanceof SlugConflictError) || isLastAttempt) throw error;
    }
  }
  // Unreachable — the loop above always returns or throws.
  throw new SlugConflictError();
}

/** Expands the onboarding-minimal identity input into the full, existing `IdentityProfileInput` shape (unset fields as `null`) — no parallel identity model. Returns `null` for GENERIC (OTHER), which has no identity profile at all. */
function toIdentityProfileInput(input: OnboardingIdentityInput): IdentityProfileInput | null {
  switch (input.family) {
    case "COUPLE":
      return {
        family: "COUPLE",
        data: {
          brideFullName: null,
          brideNickname: input.firstName,
          brideFather: null,
          brideMother: null,
          brideInstagram: null,
          groomFullName: null,
          groomNickname: input.secondName,
          groomFather: null,
          groomMother: null,
          groomInstagram: null,
          yearsTogether: null,
        },
      };
    case "PERSON":
      return {
        family: "PERSON",
        data: {
          fullName: null,
          nickname: input.name,
          age: null,
          milestone: null,
          hostedBy: null,
          instagram: null,
        },
      };
    case "BABY_FAMILY":
      return {
        family: "BABY_FAMILY",
        data: {
          babyFullName: null,
          babyNickname: input.name,
          fatherName: null,
          motherName: null,
          birthDate: null,
          birthDetails: null,
        },
      };
    case "HOST_GROUP":
      return {
        family: "HOST_GROUP",
        data: { hostName: input.name, occasionTheme: null, contactInfo: null },
      };
    case "ORGANIZATION":
      return {
        family: "ORGANIZATION",
        data: { organizationName: input.name, contactPerson: null, dressCode: null },
      };
    case "GENERIC":
      return null;
  }
}

export interface OnboardingResult {
  eventId: string;
  /**
   * `true` when the DRAFT event itself was created successfully but a
   * later step (schedule/identity/template) failed — the caller still
   * redirects to the existing editor, which is exactly where the owner
   * would go to add/fix any of those pieces manually anyway. This mirrors
   * the pre-existing lifecycle: a DRAFT event with no schedule/identity/
   * template yet is the same valid, resumable state
   * `/dashboard/events/new` has always produced immediately after
   * creation, before the owner has touched the editor at all — not a
   * newly-invented "broken" state. The specific failure is still logged
   * for operators (never silently discarded), matching this codebase's
   * existing `mapEventErrorMessage()`/`mapEditorErrorMessage()` convention
   * of always logging the raw error.
   */
  warning: boolean;
}

/**
 * Orchestrates the existing, independently-tested event creation/editor
 * services into one first-event onboarding flow (docs/PRD.md §10,
 * docs/DECISIONS.md D-071). Creates a DRAFT event — never publishes
 * (docs/F4_CANONICAL_PUBLISH_CONTRACT.md governs publish eligibility only,
 * never draft creation). No new Prisma model, no migration.
 */
export async function completeOnboarding(
  userId: string,
  input: OnboardingInput,
): Promise<OnboardingResult> {
  // Fail fast, before creating anything: a family/type mismatch is a
  // client bug or tampering attempt (the wizard always derives `identity`
  // from the selected `type` itself), not a legitimate runtime hiccup — it
  // must not leave behind an orphaned DRAFT event. `updateIdentityProfile`
  // re-checks this same invariant server-side regardless (defense in
  // depth); this pre-check only controls *when* the request fails.
  if (input.identity.family !== EVENT_TYPE_CONFIG[input.type].family) {
    throw new IdentityFamilyMismatchError();
  }

  const event = await createEventWithGeneratedSlug(userId, input.title, input.type);

  let warning = false;
  try {
    await createSchedule(event.id, userId, {
      title: EVENT_TYPE_LABELS[input.type],
      description: null,
      date: input.date,
      startTime: DEFAULT_SCHEDULE_START,
      endTime: DEFAULT_SCHEDULE_END,
      venue: null,
    });

    const identityInput = toIdentityProfileInput(input.identity);
    if (identityInput) {
      await updateIdentityProfile(event.id, userId, identityInput);
    }

    await selectTemplate(event.id, userId, input.templateSlug);
  } catch (error) {
    console.error("[onboarding] DRAFT event created, but a follow-up step failed", error);
    warning = true;
  }

  return { eventId: event.id, warning };
}
