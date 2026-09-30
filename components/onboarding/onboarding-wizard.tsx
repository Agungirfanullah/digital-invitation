"use client";

import { useActionState, useMemo, useState, type MouseEvent } from "react";
import type { EventType } from "@prisma/client";

import { completeOnboardingAction, type OnboardingActionState } from "@/lib/onboarding/actions";
import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";
import { EVENT_TYPE_OPTIONS } from "@/lib/events/labels";
import { FormField } from "@/components/forms/form-field";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface OnboardingTemplateOption {
  slug: string;
  name: string;
}

const initialState: OnboardingActionState = {};

const BASE_STEPS = ["type", "name", "date", "identity", "template"] as const;
type Step = (typeof BASE_STEPS)[number];

const STEP_TITLES: Record<Step, string> = {
  type: "Jenis acara",
  name: "Nama acara",
  date: "Tanggal acara",
  identity: "Identitas",
  template: "Template",
};

/**
 * All steps render inside one `<form>` (hidden via the `hidden` attribute,
 * not unmounted) so a single native submission carries every field via
 * `FormData` — the same server-action-driven pattern already used by
 * `CreateEventForm`/`RegisterForm`, just spread across client-only-visible
 * steps instead of one screen. No Event/draft is created until the final
 * "Buat Undangan" submit (docs/DECISIONS.md D-071 §12) — step navigation
 * only ever touches local component state.
 */
export function OnboardingWizard({ templates }: { templates: OnboardingTemplateOption[] }) {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [type, setType] = useState<EventType>("WEDDING");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [identityFirst, setIdentityFirst] = useState("");
  const [identitySecond, setIdentitySecond] = useState("");
  const [templateSlug, setTemplateSlug] = useState(templates[0]?.slug ?? "");
  const [stepError, setStepError] = useState<string | undefined>();

  const config = EVENT_TYPE_CONFIG[type];
  const family = config.family;

  const steps = useMemo<Step[]>(
    () =>
      family === "GENERIC" ? BASE_STEPS.filter((step) => step !== "identity") : [...BASE_STEPS],
    [family],
  );
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  function goNext() {
    if (currentStep === "name" && title.trim().length < 3) {
      setStepError("Nama acara minimal 3 karakter.");
      return;
    }
    if (currentStep === "date" && !date) {
      setStepError("Tanggal wajib diisi.");
      return;
    }
    if (currentStep === "identity") {
      if (family === "COUPLE" && (!identityFirst.trim() || !identitySecond.trim())) {
        setStepError("Kedua nama wajib diisi.");
        return;
      }
      if (family !== "COUPLE" && !identityFirst.trim()) {
        setStepError("Nama wajib diisi.");
        return;
      }
    }
    setStepError(undefined);
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  function goBack() {
    setStepError(undefined);
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  function handleSubmitClick(event: MouseEvent<HTMLButtonElement>) {
    if (!templateSlug) {
      event.preventDefault();
      setStepError("Pilih salah satu template.");
    }
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <p className="text-muted-foreground text-center text-sm">
        Langkah {stepIndex + 1} dari {steps.length} — {STEP_TITLES[currentStep]}
      </p>

      <FormError message={stepError ?? state.error} />

      <div hidden={currentStep !== "type"} className="space-y-1.5">
        <label htmlFor="onboarding-type" className="text-sm leading-none font-medium">
          Jenis acara
        </label>
        <Select
          id="onboarding-type"
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as EventType)}
          aria-describedby="onboarding-type-hint"
        >
          {EVENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <p id="onboarding-type-hint" className="text-muted-foreground text-xs">
          Menentukan isi identitas dan istilah di undangan. Tidak dapat diubah setelah acara dibuat.
        </p>
      </div>

      <div hidden={currentStep !== "name"}>
        <FormField
          label="Nama acara"
          name="title"
          type="text"
          placeholder="mis. Pernikahan Raka & Nadia, Ulang Tahun Citra ke-17"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={currentStep === "name" ? state.fieldErrors?.title?.[0] : undefined}
        />
      </div>

      <div hidden={currentStep !== "date"}>
        <FormField
          label="Tanggal acara"
          name="date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          hint="Bisa diubah lagi nanti di editor, termasuk jam dan lokasi."
          error={currentStep === "date" ? state.fieldErrors?.date?.[0] : undefined}
        />
      </div>

      {family !== "GENERIC" && (
        <div hidden={currentStep !== "identity"} className="space-y-4">
          {family === "COUPLE" && config.coupleLabels ? (
            <>
              <FormField
                label={config.coupleLabels.first}
                name="identityFirst"
                type="text"
                value={identityFirst}
                onChange={(event) => setIdentityFirst(event.target.value)}
              />
              <FormField
                label={config.coupleLabels.second}
                name="identitySecond"
                type="text"
                value={identitySecond}
                onChange={(event) => setIdentitySecond(event.target.value)}
              />
            </>
          ) : (
            <FormField
              label={config.identityHeading}
              name="identityFirst"
              type="text"
              value={identityFirst}
              onChange={(event) => setIdentityFirst(event.target.value)}
            />
          )}
        </div>
      )}

      <div hidden={currentStep !== "template"} className="space-y-3">
        <p className="text-sm leading-none font-medium">Template undangan</p>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((template) => {
            const isSelected = templateSlug === template.slug;
            return (
              <li key={template.slug}>
                <label
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border p-4 text-left transition-colors",
                    isSelected ? "border-primary bg-accent" : "border-border hover:bg-accent/50",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="templateSlug"
                      value={template.slug}
                      checked={isSelected}
                      onChange={() => setTemplateSlug(template.slug)}
                      className="accent-primary"
                    />
                    <span className="font-medium">{template.name}</span>
                  </span>
                  {isSelected && <span className="text-primary text-xs font-medium">Dipilih</span>}
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={stepIndex === 0 || pending}
        >
          Kembali
        </Button>
        {/*
          Two permanently-distinct elements, toggled with `hidden` — not one
          button whose `type` flips between "button" and "submit". React
          reconciles a single conditionally-typed button onto the *same* DOM
          node, and mutating a live node's `type` from "button" to "submit"
          synchronously inside its own click handler makes the browser treat
          that very click as a form submission too (the "Lanjut" click that
          advances into the last step ends up submitting the form a second,
          premature time with whatever step it just left). Keeping both as
          separate nodes avoids the hazard entirely.
        */}
        <Button type="button" onClick={goNext} disabled={pending} hidden={isLastStep}>
          Lanjut
        </Button>
        <Button type="submit" disabled={pending} onClick={handleSubmitClick} hidden={!isLastStep}>
          {pending ? "Menyimpan..." : "Buat Undangan"}
        </Button>
      </div>
    </form>
  );
}
