"use client";

import { cn } from "@/lib/utils";

export type EditorSectionKey =
  "couple" | "schedule" | "loveStory" | "gallery" | "theme" | "template";

const SECTIONS: { key: EditorSectionKey; label: string }[] = [
  { key: "couple", label: "Mempelai" },
  { key: "schedule", label: "Jadwal Acara" },
  { key: "loveStory", label: "Kisah Cinta" },
  { key: "gallery", label: "Galeri" },
  { key: "theme", label: "Tema" },
  { key: "template", label: "Template" },
];

export function EditorSidebar({
  active,
  onChange,
}: {
  active: EditorSectionKey;
  onChange: (section: EditorSectionKey) => void;
}) {
  return (
    <nav
      aria-label="Bagian undangan"
      className="flex gap-1 overflow-x-auto p-2 lg:w-48 lg:flex-col lg:overflow-visible"
    >
      {SECTIONS.map((section) => (
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
