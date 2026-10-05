"use client";

import type { EventType } from "@prisma/client";

import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";
import { cn } from "@/lib/utils";

export type EditorSectionKey =
  "identity" | "schedule" | "story" | "gallery" | "sections" | "theme" | "template";

/**
 * Type-aware navigation: labels come from the event type's configuration,
 * and the identity entry is omitted entirely for a type with no identity
 * form (OTHER) — the editor never offers an irrelevant form.
 */
export function getEditorSections(type: EventType): { key: EditorSectionKey; label: string }[] {
  const config = EVENT_TYPE_CONFIG[type];
  return [
    ...(config.identityNavLabel
      ? [{ key: "identity" as const, label: config.identityNavLabel }]
      : []),
    { key: "schedule", label: "Jadwal Acara" },
    { key: "story", label: config.storyNavLabel },
    { key: "gallery", label: "Galeri" },
    { key: "sections", label: "Bagian Undangan" },
    { key: "template", label: "Tema" },
    { key: "theme", label: "Warna & Font" },
  ];
}

export function EditorSidebar({
  type,
  active,
  onChange,
}: {
  type: EventType;
  active: EditorSectionKey;
  onChange: (section: EditorSectionKey) => void;
}) {
  return (
    <nav
      aria-label="Bagian undangan"
      className="flex gap-1 overflow-x-auto p-2 lg:w-48 lg:flex-col lg:overflow-visible"
    >
      {getEditorSections(type).map((section) => (
        <button
          key={section.key}
          type="button"
          aria-current={active === section.key ? "page" : undefined}
          onClick={() => onChange(section.key)}
          className={cn(
            "shrink-0 rounded-md px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors",
            active === section.key
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          )}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
