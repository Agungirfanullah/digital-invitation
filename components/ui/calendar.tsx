"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { id as idLocale } from "react-day-picker/locale";

import { cn } from "@/lib/utils";

function Chevron({ orientation, className }: { orientation?: string; className?: string }) {
  const path = orientation === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-4", className)}
    >
      <path d={path} />
    </svg>
  );
}

const navButton =
  "text-foreground hover:bg-accent focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40";

/**
 * The shadcn-style calendar: Indonesian month and weekday names, weeks
 * starting on Monday, and colors from the app's own theme tokens. Pass
 * `mode`, `selected` and `onSelect` as for any DayPicker.
 */
function Calendar({ className, classNames, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      locale={idLocale}
      weekStartsOn={1}
      showOutsideDays
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-4",
        month: "flex w-full flex-col gap-3",
        month_caption: "flex h-8 items-center justify-center px-9",
        caption_label: "text-sm font-semibold",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: navButton,
        button_next: navButton,
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground w-9 text-center text-xs font-normal",
        weeks: "block",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button:
          "hover:bg-accent focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-md font-normal outline-none transition-colors focus-visible:ring-2",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:font-semibold",
        today: "[&>button]:ring-primary/60 [&>button]:ring-1",
        outside: "text-muted-foreground opacity-50",
        disabled: "opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{ Chevron }}
      {...props}
    />
  );
}

export { Calendar };
