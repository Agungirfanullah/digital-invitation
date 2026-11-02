import type { ReactNode } from "react";

import { EDITOR_SECTION_ICONS } from "@/components/editor/editor-icons";
import type { EditorSectionKey } from "@/components/editor/editor-sidebar";

/** The title block at the top of every editor section: its icon, heading and short description. */
export function EditorSectionHeader({
  section,
  children,
}: {
  section: EditorSectionKey;
  children: ReactNode;
}) {
  return (
    <div className="border-border/60 flex items-start gap-4 border-b pb-5">
      <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
        <span className="size-5">{EDITOR_SECTION_ICONS[section]}</span>
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
