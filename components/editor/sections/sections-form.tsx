"use client";

import { useState, useTransition } from "react";
import type { EventType } from "@prisma/client";

import { saveSectionOverridesAction } from "@/lib/editor/actions";
import {
  getSectionLabel,
  INVITATION_SECTION_KEYS,
  resolveSectionStates,
  type InvitationSectionKey,
  type SectionOverrides,
} from "@/lib/event-types/sections";
import { FormError } from "@/components/forms/form-error";

interface SectionsFormProps {
  eventId: string;
  type: EventType;
  value: SectionOverrides;
  onSaved: (value: SectionOverrides) => void;
}

/**
 * Owner on/off switches for invitation sections. Each toggle saves
 * immediately (a single click is not a keystroke stream, so no debounce is
 * needed); the server re-validates that the section is toggleable for this
 * event type. Only supported sections are listed.
 */
export function SectionsForm({ eventId, type, value, onSaved }: SectionsFormProps) {
  // Optimistic: the switch flips immediately and reverts if the save fails,
  // instead of appearing unresponsive until the server answers.
  const [pending, setPending] = useState<{ key: InvitationSectionKey; enabled: boolean } | null>(
    null,
  );
  const states = resolveSectionStates(type, {
    sections: pending ? { ...value, [pending.key]: pending.enabled } : value,
  });
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function toggle(key: InvitationSectionKey, enabled: boolean) {
    setError(undefined);
    setPending({ key, enabled });
    startTransition(async () => {
      const result = await saveSectionOverridesAction(eventId, { [key]: enabled });
      if (result.ok) {
        onSaved(result.data);
      } else {
        setError(result.error);
      }
      setPending(null);
    });
  }

  const supportedKeys = INVITATION_SECTION_KEYS.filter((key) => states[key].supported);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Bagian Undangan</h2>
        <p className="text-muted-foreground text-sm">
          Pilih bagian yang ditampilkan di undangan. Sampul dan penutup selalu tampil.
        </p>
      </div>

      <FormError message={error} />

      <ul className="divide-y rounded-lg border">
        {supportedKeys.map((key) => {
          const state = states[key];
          const inputId = `section-${key}`;
          return (
            <li key={key} className="flex items-center justify-between gap-4 p-4">
              <label htmlFor={inputId} className="text-sm font-medium">
                {getSectionLabel(type, key)}
              </label>
              <div className="flex items-center gap-3">
                {pending?.key === key && (
                  <span className="text-muted-foreground text-xs" aria-live="polite">
                    Menyimpan...
                  </span>
                )}
                <input
                  id={inputId}
                  type="checkbox"
                  className="size-5 accent-current"
                  checked={state.enabled}
                  disabled={!state.toggleable || isPending}
                  onChange={(e) => toggle(key, e.target.checked)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-muted-foreground text-xs">
        Bagian yang dimatikan tidak ditampilkan di undangan publik, dan datanya tidak ikut dikirim
        ke browser tamu. RSVP dan ucapan juga tidak dapat dikirim saat bagiannya dimatikan.
      </p>
    </div>
  );
}
