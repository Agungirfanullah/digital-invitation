"use client";

import { useState, useTransition } from "react";
import type { EventType } from "@prisma/client";

import { moveSectionOrderAction, saveSectionOverridesAction } from "@/lib/editor/actions";
import {
  getSectionLabel,
  resolveSectionOrder,
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
  /** Raw persisted section order, or `null` if none is stored yet. */
  order: InvitationSectionKey[] | null;
  onOrderSaved: (value: InvitationSectionKey[]) => void;
}

/**
 * Owner on/off switches and display-order controls for invitation
 * sections (docs/PRD.md §15 "Enable, Disable, Reorder"). Each toggle/move
 * saves immediately (a single click is not a keystroke stream, so no
 * debounce is needed); the server re-validates that the section is
 * toggleable for this event type. Only supported sections are listed, in
 * their current resolved display order — matching exactly what the public
 * invitation and preview will render. Closing is never listed here: it is
 * structural (D-064) and always renders after every section below.
 */
export function SectionsForm({
  eventId,
  type,
  value,
  onSaved,
  order,
  onOrderSaved,
}: SectionsFormProps) {
  // Optimistic: the switch/move applies immediately and reverts if the
  // save fails, instead of appearing unresponsive until the server answers.
  const [pendingToggle, setPendingToggle] = useState<{
    key: InvitationSectionKey;
    enabled: boolean;
  } | null>(null);
  const [pendingMove, setPendingMove] = useState<InvitationSectionKey | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const states = resolveSectionStates(type, {
    sections: pendingToggle ? { ...value, [pendingToggle.key]: pendingToggle.enabled } : value,
  });
  const resolvedOrder = resolveSectionOrder({ sectionOrder: order });
  const supportedOrder = resolvedOrder.filter((key) => states[key].supported);

  function toggle(key: InvitationSectionKey, enabled: boolean) {
    setError(undefined);
    setPendingToggle({ key, enabled });
    startTransition(async () => {
      const result = await saveSectionOverridesAction(eventId, { [key]: enabled });
      if (result.ok) {
        onSaved(result.data);
      } else {
        setError(result.error);
      }
      setPendingToggle(null);
    });
  }

  function move(key: InvitationSectionKey, direction: "up" | "down") {
    setError(undefined);
    setPendingMove(key);
    startTransition(async () => {
      const result = await moveSectionOrderAction(eventId, { key, direction });
      if (result.ok) {
        onOrderSaved(result.data);
      } else {
        setError(result.error);
      }
      setPendingMove(null);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Bagian Undangan</h2>
        <p className="text-muted-foreground text-sm">
          Pilih dan atur urutan bagian yang ditampilkan di undangan. Penutup selalu tampil terakhir.
        </p>
      </div>

      <FormError message={error} />

      <ul className="divide-y rounded-lg border">
        {supportedOrder.map((key, index) => {
          const state = states[key];
          const inputId = `section-${key}`;
          const isFirst = index === 0;
          const isLast = index === supportedOrder.length - 1;
          return (
            <li key={key} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label={`Naikkan ${getSectionLabel(type, key)}`}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={isFirst || isPending}
                    onClick={() => move(key, "up")}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Turunkan ${getSectionLabel(type, key)}`}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    disabled={isLast || isPending}
                    onClick={() => move(key, "down")}
                  >
                    ▼
                  </button>
                </div>
                <label htmlFor={inputId} className="text-sm font-medium">
                  {getSectionLabel(type, key)}
                </label>
              </div>
              <div className="flex items-center gap-3">
                {(pendingToggle?.key === key || pendingMove === key) && (
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
