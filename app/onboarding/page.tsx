import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { listTemplateOptions } from "@/lib/editor/service";
import { listEventsForUser } from "@/lib/events/service";
import { DashboardLogo } from "@/components/dashboard/dashboard-brand";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Buat Undangan Pertamamu",
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
    <div className="bg-muted/30 flex flex-1 flex-col px-4 py-6 sm:px-8">
      <DashboardLogo />
      <div className="mx-auto w-full max-w-xl py-10 sm:py-14">
        <div className="mb-8 text-center">
          <p className="text-primary text-sm font-semibold">Selamat datang, {user.name}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance">
            Yuk, buat undangan pertamamu.
          </h1>
        </div>
        <div className="border-border/60 bg-card rounded-3xl border p-6 shadow-sm sm:p-8">
          <OnboardingWizard templates={templates} />
        </div>
      </div>
    </div>
  );
}
