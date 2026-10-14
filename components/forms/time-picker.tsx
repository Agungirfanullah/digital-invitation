"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";

import { PickerField } from "@/components/forms/picker-field";
import { buildTimeSlots, isSlotUnavailable, pickInitialSlot } from "@/lib/forms/date-time";
import { cn } from "@/lib/utils";

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/**
 * A time field that opens a scrolling list of 15-minute slots. Reads and
 * writes `HH:mm` strings. `min` makes every slot up to and including it
 * unselectable — the end-time list passes the start time, matching the
 * server rule that a schedule must end after it starts. A stored value off
 * the 15-minute grid still displays as-is until the person picks a slot.
 */
export function TimePicker({
  label,
  name,
  value,
  onChange,
  min,
  error,
  hint,
  placeholder = "Pilih jam",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const slots = useMemo(() => buildTimeSlots(), []);
  const optionRefs = useRef(new Map<string, HTMLButtonElement>());
  const target = pickInitialSlot(slots, value, min);

  function focusSlot(slot: string | null | undefined) {
    const element = slot ? optionRefs.current.get(slot) : undefined;
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView?.({ block: "center" });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const available = slots.filter((slot) => !isSlotUnavailable(slot, min));
    const focused = available.findIndex(
      (slot) => optionRefs.current.get(slot) === document.activeElement,
    );

    let next = focused;
    if (event.key === "ArrowDown") next = Math.min(available.length - 1, focused + 1);
    if (event.key === "ArrowUp") next = Math.max(0, focused - 1);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = available.length - 1;

    focusSlot(available[next]);
  }

  return (
    <PickerField
      label={label}
      name={name}
      value={value}
      displayValue={value || null}
      placeholder={placeholder}
      icon={<ClockIcon />}
      error={error}
      hint={hint}
      open={open}
      onOpenChange={setOpen}
      contentProps={{
        onOpenAutoFocus: (event) => {
          event.preventDefault();
          focusSlot(target);
        },
      }}
    >
      <div
        role="listbox"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="max-h-64 w-36 overflow-y-auto p-1"
      >
        {slots.map((slot) => {
          const unavailable = isSlotUnavailable(slot, min);
          const selected = slot === value;

          return (
            <button
              key={slot}
              ref={(element) => {
                if (element) optionRefs.current.set(slot, element);
                else optionRefs.current.delete(slot);
              }}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={unavailable}
              tabIndex={slot === target ? 0 : -1}
              onClick={() => {
                onChange(slot);
                setOpen(false);
              }}
              className={cn(
                "focus-visible:ring-ring flex h-9 w-full items-center justify-center rounded-md text-sm transition-colors outline-none focus-visible:ring-2",
                selected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-accent disabled:text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent",
              )}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </PickerField>
  );
}
