import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/forms/password-input";

interface FormFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}

export function FormField({ label, name, error, hint, type, ...props }: FormFieldProps) {
  const fieldProps = {
    "aria-invalid": !!error,
    "aria-describedby": error ? `${name}-error` : hint ? `${name}-hint` : undefined,
    ...props,
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm leading-none font-medium">
        {label}
      </label>
      {type === "password" ? (
        <PasswordInput id={name} name={name} {...fieldProps} />
      ) : (
        <Input id={name} name={name} type={type} {...fieldProps} />
      )}
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
