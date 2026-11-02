"use client";

import type { EventType } from "@prisma/client";

import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";
import { cn } from "@/lib/utils";
import { EDITOR_SECTION_ICONS } from "@/components/editor/editor-icons";

export type EditorSectionKey =
  "identity" | "schedule" | "story" | "gallery" | "sections" | "theme" | "template";

type EditorSectionGroup = "content" | "look";

const GROUP_LABELS: Record<EditorSectionGroup, string> = {
  content: "Isi undangan",
  look: "Tampilan",
};

/**
 * Type-aware navigation: labels come from the event type's configuration,
 * and the identity entry is omitted entirely for a type with no identity
 * form (OTHER) — the editor never offers an irrelevant form.
 */
export function getEditorSections(
  type: EventType,
): { key: EditorSectionKey; label: string; group: EditorSectionGroup }[] {
  const config = EVENT_TYPE_CONFIG[type];
  return [
    ...(config.identityNavLabel
      ? [{ key: "identity" as const, label: config.identityNavLabel, group: "content" as const }]
      : []),
    { key: "schedule", label: "Jadwal Acara", group: "content" },
    { key: "story", label: config.storyNavLabel, group: "content" },
    { key: "gallery", label: "Galeri", group: "content" },
    { key: "sections", label: "Bagian Undangan", group: "look" },
    { key: "template", label: "Tema", group: "look" },
    { key: "theme", label: "Warna & Font", group: "look" },
  ];
}

/**
 * Grouped into "what the invitation says" and "how it looks". An extra-wide
 * screen (2xl) gets a vertical list under group headings; anything narrower
 * gets one horizontally scrolling row of chips above the form, so the form
 * keeps its width beside the dashboard sidebar and the live preview. Each
 * button's accessible name is just its label (the icon is decorative).
 */
export function EditorSidebar({
  type,
  active,
  onChange,
}: {
  type: EventType;
  active: EditorSectionKey;
  onChange: (section: EditorSectionKey) => void;
}) {
  const sections = getEditorSections(type);
  const groups: EditorSectionGroup[] = ["content", "look"];

  return (
    <nav
      aria-label="Bagian undangan"
      className="no-scrollbar border-border/60 flex gap-1.5 overflow-x-auto border-b px-4 py-3 sm:px-6 lg:flex-wrap lg:overflow-visible 2xl:w-56 2xl:shrink-0 2xl:flex-col 2xl:gap-5 2xl:overflow-visible 2xl:border-r 2xl:border-b-0 2xl:px-3 2xl:py-5"
    >
      {groups.map((group) => (
        <div
          key={group}
          className="flex shrink-0 gap-1.5 lg:shrink lg:flex-wrap 2xl:flex-col 2xl:flex-nowrap 2xl:gap-1"
        >
          <p className="text-muted-foreground/80 hidden px-3 pb-1 text-[11px] font-semibold tracking-wider uppercase 2xl:block">
            {GROUP_LABELS[group]}
          </p>
          {sections
            .filter((section) => section.group === group)
            .map((section) => {
              const isActive = active === section.key;
              return (
                <button
                  key={section.key}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onChange(section.key)}
                  className={cn(
                    "group focus-visible:ring-ring flex shrink-0 items-center gap-2.5 rounded-full border px-3.5 py-2 text-left text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 2xl:rounded-xl 2xl:border-transparent 2xl:px-3",
                    isActive
                      ? "border-primary/20 bg-primary/10 text-primary 2xl:shadow-xs"
                      : "border-border/60 bg-card text-muted-foreground hover:text-foreground 2xl:hover:bg-muted 2xl:bg-transparent",
                  )}
                >
                  <span
                    className={cn(
                      "size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-primary" : "text-muted-foreground/80",
                    )}
                  >
                    {EDITOR_SECTION_ICONS[section.key]}
                  </span>
                  {section.label}
                </button>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
