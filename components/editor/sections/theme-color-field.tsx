"use client";

import { COLOR_PRESETS, findColorPresetName, normalizeHex } from "@/lib/invitations/theme-options";
import { Button } from "@/components/ui/button";

interface ThemeColorFieldProps {
  label: string;
  name: string;
  /** The owner's choice, or `null` to follow the template's default. */
  value: string | null;
  /** The template's own color, shown while nothing is chosen. */
  defaultValue: string;
  onChange: (value: string | null) => void;
  error?: string;
}

/**
 * Picks a color by name from a palette, or any color with the browser's
 * own color picker — no hex typing. The stored value is still a hex
 * string; `null` means "use the template's color".
 */
export function ThemeColorField({
  label,
  name,
  value,
  defaultValue,
  onChange,
  error,
}: ThemeColorFieldProps) {
  const shown = value ?? defaultValue;
  const chosenHex = normalizeHex(value);
  const currentName = value
    ? (findColorPresetName(value) ?? "Warna pilihan sendiri")
    : "Bawaan tema";

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm leading-none font-medium">{label}</legend>

      <div className="flex items-center gap-2">
        <span
          className="size-8 shrink-0 rounded-md border"
          style={{ backgroundColor: shown }}
          aria-hidden
        />
        <span className="text-muted-foreground text-sm" data-testid={`${name}-current`}>
          {currentName}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Pilihan ${label}`}>
        {COLOR_PRESETS.map((preset) => {
          const selected = chosenHex === preset.hex;
          return (
            <button
              key={preset.hex}
              type="button"
              title={preset.name}
              aria-label={preset.name}
              aria-pressed={selected}
              onClick={() => onChange(preset.hex)}
              className="focus-visible:ring-ring size-7 rounded-full border transition-shadow focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none aria-pressed:ring-2 aria-pressed:ring-offset-2"
              style={{ backgroundColor: preset.hex }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={name} className="text-muted-foreground flex items-center gap-2 text-xs">
          Warna lain
          <input
            id={name}
            name={name}
            type="color"
            value={chosenHex ?? normalizeHex(defaultValue) ?? "#000000"}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
            className="h-8 w-12 cursor-pointer rounded border bg-transparent p-0.5"
          />
        </label>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Pakai bawaan tema
          </Button>
        )}
      </div>

      {error && (
        <p id={`${name}-error`} className="text-destructive text-xs">
          {error}
        </p>
      )}
    </fieldset>
  );
}
