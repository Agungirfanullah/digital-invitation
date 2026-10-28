import type { ReactNode } from "react";

/** Line icons shared by the dashboard sidebar and the event hub's menu grid. */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const EVENT_ICONS = {
  editor: (
    <svg {...iconProps}>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M3.5 9h17M9 9v11M13 13h4M13 16h3" />
    </svg>
  ),
  guests: (
    <svg {...iconProps}>
      <circle cx="9" cy="8.5" r="3.25" />
      <path d="M2.75 19.5c.5-3.4 3-5.25 6.25-5.25s5.75 1.85 6.25 5.25" />
      <path d="M15.5 5.5a3 3 0 0 1 0 6M18 14.75c1.6.7 2.9 2.3 3.25 4.75" />
    </svg>
  ),
  rsvp: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5.3" />
    </svg>
  ),
  gifts: (
    <svg {...iconProps}>
      <rect x="3.5" y="9" width="17" height="11" rx="1.5" />
      <path d="M3.5 13h17M12 9v11" />
      <path d="M12 9C9.5 9 8 7.5 8 6a2 2 0 0 1 4 0 2 2 0 0 1 4 0c0 1.5-1.5 3-4 3Z" />
    </svg>
  ),
  wishes: (
    <svg {...iconProps}>
      <path d="M4 5h16v11H8.5L4 20.25V5Z" />
      <path d="M8.5 9.5h7M8.5 12.5h4" />
    </svg>
  ),
  checkIn: (
    <svg {...iconProps}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <path d="M14.5 14.5h3v3h-3zM19.5 14.5h1v1h-1zM14.5 19.5h1v1h-1zM19.5 19.5h1v1h-1z" />
    </svg>
  ),
  analytics: (
    <svg {...iconProps}>
      <path d="M4 20V10M10 20V4M16 20v-8M21 20H3" />
    </svg>
  ),
  settings: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
    </svg>
  ),
} satisfies Record<string, ReactNode>;

export const NAV_ICONS = {
  home: (
    <svg {...iconProps}>
      <path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5M10 20v-5h4v5" />
    </svg>
  ),
  invitations: (
    <svg {...iconProps}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7.5 8 6 8-6" />
    </svg>
  ),
  plus: (
    <svg {...iconProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  overview: (
    <svg {...iconProps}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  ),
  menu: (
    <svg {...iconProps}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  close: (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  logout: (
    <svg {...iconProps}>
      <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" />
    </svg>
  ),
} satisfies Record<string, ReactNode>;
