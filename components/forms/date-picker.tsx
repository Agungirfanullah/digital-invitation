"use client";

import { useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { PickerField } from "@/components/forms/picker-field";
import { parseIsoDate, toIsoDate } from "@/lib/forms/date-time";
import { formatIndonesianDate } from "@/lib/invitations/format";

function CalendarIcon() {
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
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" />
    </svg>
  );
}

/**
 * A date field with a calendar popover. Reads and writes `YYYY-MM-DD`
 * strings (the app's stored format), so it is a drop-in for the native date
 * input. The month shown on opening is the selected date's, else today's.
 */
export function DatePicker({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  placeholder = "Pilih tanggal",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);

  return (
    <PickerField
      label={label}
      name={name}
      value={value}
      displayValue={selected ? formatIndonesianDate(value) : null}
      placeholder={placeholder}
      icon={<CalendarIcon />}
      error={error}
      hint={hint}
      open={open}
      onOpenChange={setOpen}
    >
      <Calendar
        mode="single"
        selected={selected ?? undefined}
        defaultMonth={selected ?? undefined}
        onSelect={(day) => {
          if (!day) return;
          onChange(toIsoDate(day));
          setOpen(false);
        }}
        autoFocus
      />
    </PickerField>
  );
}
