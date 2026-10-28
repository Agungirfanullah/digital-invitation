"use client";

import { useState, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "size-[18px]",
};

/**
 * A password input with a show/hide toggle. Hidden by default; the toggle
 * only changes the input's `type`, so the value, autofill and form
 * submission are untouched.
 */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-11", className)} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={visible}
        aria-controls={props.id}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg transition-colors outline-none focus-visible:ring-2"
      >
        {visible ? (
          <svg {...iconProps}>
            <path d="M3 3l18 18" />
            <path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4.3 9.5 7-.4 1-1.2 2.4-2.4 3.6M6.5 6.6C4.5 7.9 3.1 9.9 2.5 12c1 2.7 4.5 7 9.5 7 1.8 0 3.4-.5 4.8-1.3" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          <svg {...iconProps}>
            <path d="M2.5 12C3.5 9.3 7 5 12 5s8.5 4.3 9.5 7c-1 2.7-4.5 7-9.5 7s-8.5-4.3-9.5-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
