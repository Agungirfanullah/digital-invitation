import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";

interface FormFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}

export function FormField({ label, name, error, hint, ...props }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm leading-none font-medium">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        {...props}
      />
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
