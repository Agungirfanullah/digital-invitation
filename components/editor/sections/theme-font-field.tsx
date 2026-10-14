"use client";

import { FONT_GROUPS, findFontOption } from "@/lib/invitations/theme-options";
import { Select } from "@/components/ui/select";

interface ThemeFontFieldProps {
  label: string;
  name: string;
  /** The owner's choice, or `null` to follow the template's default. */
  value: string | null;
  /** The template's own font stack, used for the preview while nothing is chosen. */
  defaultValue: string;
  onChange: (value: string | null) => void;
  error?: string;
}

/** Picks a font from a short list, with a live sample line. */
export function ThemeFontField({
  label,
  name,
  value,
  defaultValue,
  onChange,
  error,
}: ThemeFontFieldProps) {
  // A font typed in before this list existed stays selectable instead of
  // silently disappearing from the form.
  const isCustom = !!value && !findFontOption(value);

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm leading-none font-medium">
        {label}
      </label>
      <Select
        id={name}
        name={name}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <option value="">Bawaan tema</option>
        {isCustom && <option value={value}>Font sebelumnya (kustom)</option>}
        {FONT_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => (
              <option key={option.stack} value={option.stack}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <p
        className="text-muted-foreground truncate text-base"
        style={{ fontFamily: value ?? defaultValue }}
        aria-hidden
      >
        Naya &amp; Bambang — 1 November 2026
      </p>
      {error && (
        <p id={`${name}-error`} className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
