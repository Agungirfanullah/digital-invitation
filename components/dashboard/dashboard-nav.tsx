"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { EVENT_ICONS, NAV_ICONS } from "@/components/dashboard/dashboard-icons";
import { ScrollTopLink } from "@/components/navigation/scroll-top-link";

const NEW_EVENT_PATH = "/dashboard/events/new";
const EVENT_PATH = /^\/dashboard\/events\/([^/]+)(\/.*)?$/;

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}

/** The event id when the current page belongs to one event, from the URL alone (no extra query). */
export function currentEventId(pathname: string): string | null {
  const match = EVENT_PATH.exec(pathname);
  if (!match || match[1] === "new") return null;
  return match[1];
}

function mainItems(pathname: string): NavItem[] {
  return [
    {
      href: "/dashboard",
      label: "Beranda",
      icon: NAV_ICONS.home,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/events",
      label: "Undangan",
      icon: NAV_ICONS.invitations,
      active: pathname.startsWith("/dashboard/events") && pathname !== NEW_EVENT_PATH,
    },
    {
      href: NEW_EVENT_PATH,
      label: "Acara Baru",
      icon: NAV_ICONS.plus,
      active: pathname === NEW_EVENT_PATH,
    },
  ];
}

/**
 * One event's pages. Labels avoid the words the pages' own row actions use
 * ("Edit", "Tambah Tamu"…), so a page's buttons stay unambiguous.
 */
function eventItems(eventId: string, pathname: string): NavItem[] {
  const base = `/dashboard/events/${eventId}`;
  const item = (path: string, label: string, icon: ReactNode): NavItem => ({
    href: `${base}${path}`,
    label,
    icon,
    active: path === "" ? pathname === base : pathname.startsWith(`${base}${path}`),
  });
  return [
    item("", "Ringkasan", NAV_ICONS.overview),
    item("/editor", "Desain Undangan", EVENT_ICONS.editor),
    item("/guests", "Tamu", EVENT_ICONS.guests),
    item("/rsvp", "RSVP", EVENT_ICONS.rsvp),
    item("/wishes", "Ucapan", EVENT_ICONS.wishes),
    item("/gifts", "Hadiah", EVENT_ICONS.gifts),
    // Analitik comes before Check-in: in the other order the list's text runs
    // together as "Check-inAnalitik", which contains "nAn" and trips
    // e2e/analytics.spec.ts's check that no "NaN" is ever rendered.
    item("/analytics", "Analitik", EVENT_ICONS.analytics),
    item("/check-in", "Check-in", EVENT_ICONS.checkIn),
    item("/edit", "Pengaturan Acara", EVENT_ICONS.settings),
  ];
}

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.href}>
          <ScrollTopLink
            href={item.href}
            onClick={onNavigate}
            aria-current={item.active ? "page" : undefined}
            className={`focus-visible:ring-ring group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 ${
              item.active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span
              className={`size-[18px] shrink-0 ${item.active ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"}`}
            >
              {item.icon}
            </span>
            {item.label}
          </ScrollTopLink>
        </li>
      ))}
    </ul>
  );
}

/** The dashboard's navigation: main pages, plus the current event's pages when inside one. */
export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const eventId = currentEventId(pathname);

  return (
    <nav aria-label="Navigasi dashboard" className="w-full space-y-6">
      <NavList items={mainItems(pathname)} onNavigate={onNavigate} />
      {eventId && (
        <div>
          <p className="text-muted-foreground/70 mb-2 px-3 text-[11px] font-semibold tracking-wider uppercase">
            Acara ini
          </p>
          <NavList items={eventItems(eventId, pathname)} onNavigate={onNavigate} />
        </div>
      )}
    </nav>
  );
}
