"use client";

import type { ComponentProps, ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PickerFieldProps {
  label: string;
  name: string;
  /** The raw value, submitted through a hidden input so the field also works inside a plain `<form>`. */
  value: string;
  /** What the trigger shows for the current value; `null` shows the placeholder. */
  displayValue: string | null;
  placeholder: string;
  icon: ReactNode;
  error?: string;
  hint?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentProps?: ComponentProps<typeof PopoverContent>;
  children: ReactNode;
}

/**
 * Shared shell of the date and time pickers: a label, a trigger styled like
 * the app's inputs, and the popover that holds the calendar or time list.
 * The trigger is named by both the label and its current value, so a screen
 * reader hears e.g. "Tanggal 12 Desember 2026".
 */
export function PickerField({
  label,
  name,
  value,
  displayValue,
  placeholder,
  icon,
  error,
  hint,
  open,
  onOpenChange,
  contentProps,
  children,
}: PickerFieldProps) {
  const labelId = `${name}-label`;
  const valueId = `${name}-value`;

  return (
    <div className="space-y-1.5">
      <label id={labelId} htmlFor={name} className="text-sm leading-none font-medium">
        {label}
      </label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            id={name}
            type="button"
            aria-labelledby={`${labelId} ${valueId}`}
            aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
            className={cn(
              "border-input flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-left text-sm shadow-sm transition-colors outline-none",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
              error && "border-destructive",
            )}
          >
            <span id={valueId} className={cn("truncate", !displayValue && "text-muted-foreground")}>
              {displayValue ?? placeholder}
            </span>
            <span aria-hidden="true" className="text-muted-foreground shrink-0">
              {icon}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent {...contentProps}>{children}</PopoverContent>
      </Popover>
      <input type="hidden" name={name} value={value} />
      {error ? (
        <p id={`${name}-error`} className="text-destructive text-xs">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${name}-hint`} className="text-muted-foreground text-xs">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
