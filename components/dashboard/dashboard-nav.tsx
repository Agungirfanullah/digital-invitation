"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function HomeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5M10 20v-5h4v5" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7.5 8 6 8-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

const NEW_EVENT_PATH = "/dashboard/events/new";

const ITEMS = [
  {
    href: "/dashboard",
    label: "Beranda",
    icon: HomeIcon,
    isActive: (pathname: string) => pathname === "/dashboard",
  },
  {
    href: "/dashboard/events",
    label: "Undangan",
    icon: EnvelopeIcon,
    isActive: (pathname: string) =>
      pathname.startsWith("/dashboard/events") && pathname !== NEW_EVENT_PATH,
  },
  {
    href: NEW_EVENT_PATH,
    label: "Acara Baru",
    icon: PlusIcon,
    isActive: (pathname: string) => pathname === NEW_EVENT_PATH,
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi dashboard" className="w-full">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map((item) => {
          const active = item.isActive(pathname);
          return (
            <li key={item.href} className="flex-1 lg:flex-none">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`focus-visible:ring-ring flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 sm:gap-2 sm:px-3 lg:justify-start ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-background/75 hover:bg-background/10 hover:text-background"
                }`}
              >
                <span className="size-4 shrink-0">
                  <item.icon />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
