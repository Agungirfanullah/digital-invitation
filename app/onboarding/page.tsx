import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { listTemplateOptions } from "@/lib/editor/service";
import { listEventsForUser } from "@/lib/events/service";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Buat Undangan Pertamamu — Digital Invitation",
};

/**
 * First-event onboarding (docs/PRD.md §10, docs/DECISIONS.md D-071).
 * Protected by `PROTECTED_PATH_PREFIXES` (edge) + `requireAppUser()`
 * (server) — the same two-layer boundary every other protected route uses.
 *
 * A user who already owns/has access to an event is redirected straight to
 * the existing dashboard instead of being forced through first-event
 * onboarding again (D-071 §8's explicit regression boundary).
 */
export default async function OnboardingPage() {
  const user = await requireAppUser();
  const events = await listEventsForUser(user.id);
  if (events.length > 0) redirect("/dashboard");

  const templates = (await listTemplateOptions()).filter((template) => template.implemented);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Yuk, buat undangan pertamamu.</h1>
      </div>
      <OnboardingWizard templates={templates} />
    </div>
  );
}
