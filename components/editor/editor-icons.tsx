import type { ReactNode } from "react";

import type { EditorSectionKey } from "@/components/editor/editor-sidebar";

/** Line icons for the editor's section navigation and section headers. */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const EDITOR_SECTION_ICONS: Record<EditorSectionKey, ReactNode> = {
  identity: (
    <svg {...iconProps}>
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M3 19c.4-3.2 2.6-5 5.5-5s5.1 1.8 5.5 5M14.5 14.2c2.6-.3 5 1.1 5.5 4.8" />
    </svg>
  ),
  schedule: (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8 14h3M8 17h6" />
    </svg>
  ),
  story: (
    <svg {...iconProps}>
      <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
    </svg>
  ),
  gallery: (
    <svg {...iconProps}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.75" />
      <path d="m20.5 16-5-5-8.5 8.5" />
    </svg>
  ),
  sections: (
    <svg {...iconProps}>
      <rect x="4" y="4" width="16" height="4.5" rx="1.25" />
      <rect x="4" y="10.5" width="16" height="4.5" rx="1.25" />
      <path d="M4 18.5h10" />
    </svg>
  ),
  template: (
    <svg {...iconProps}>
      <rect x="6.5" y="3" width="11" height="18" rx="2" />
      <path d="M9.5 7.5h5M9.5 11h5M10.5 15.5h3" />
    </svg>
  ),
  theme: (
    <svg {...iconProps}>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2a1.6 1.6 0 0 1 1.2-2.7h1.9a3.8 3.8 0 0 0 3.8-3.8c0-4.3-3.6-7.7-8-7.7Z" />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="10" cy="7.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="7.5" r="1" fill="currentColor" />
    </svg>
  ),
};
