import type { ReactNode } from "react";
import Link from "next/link";

import { EVENT_ICONS as ICONS } from "@/components/dashboard/dashboard-icons";

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
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={`group focus-visible:ring-ring flex h-full min-h-28 flex-col items-start justify-between gap-3 rounded-2xl p-4 text-left text-sm font-semibold transition-all duration-200 outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 ${
              item.primary
                ? "bg-foreground text-background shadow-sm"
                : "border-border/60 bg-card text-foreground hover:border-primary/30 border shadow-xs"
            }`}
          >
            <span
              className={`flex size-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${
                item.primary ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
              }`}
            >
              <span className="size-5">{item.icon}</span>
            </span>
            <span className="leading-tight">{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
