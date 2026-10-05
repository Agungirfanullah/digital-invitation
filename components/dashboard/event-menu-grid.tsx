import type { ReactNode } from "react";
import Link from "next/link";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ICONS = {
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

export function EventMenuGrid({ eventId }: { eventId: string }) {
  const base = `/dashboard/events/${eventId}`;
  const items: { href: string; label: string; icon: ReactNode; primary?: boolean }[] = [
    { href: `${base}/editor`, label: "Editor Undangan", icon: ICONS.editor, primary: true },
    { href: `${base}/guests`, label: "Tamu", icon: ICONS.guests },
    { href: `${base}/rsvp`, label: "RSVP", icon: ICONS.rsvp },
    { href: `${base}/gifts`, label: "Hadiah", icon: ICONS.gifts },
    { href: `${base}/wishes`, label: "Ucapan", icon: ICONS.wishes },
    { href: `${base}/check-in`, label: "Check-in", icon: ICONS.checkIn },
    { href: `${base}/analytics`, label: "Analitik", icon: ICONS.analytics },
    { href: `${base}/edit`, label: "Edit Acara", icon: ICONS.settings },
  ];

  return (
    <ul className="grid grid-cols-3 gap-2.5">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={`focus-visible:ring-ring text-primary-foreground flex h-full min-h-24 flex-col items-center justify-center gap-2 rounded-xl p-2 text-center text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              item.primary
                ? "bg-foreground hover:bg-foreground/90"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            <span className="size-8">{item.icon}</span>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
