import type { ReactNode } from "react";
import Link from "next/link";

import { requireAppUser } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]);
  return letters.join("").toUpperCase() || "?";
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAppUser();

  return (
    <div className="bg-background/50 flex min-h-screen flex-1 flex-col lg:flex-row">
      <aside className="bg-foreground text-background border-border/20 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-b px-5 py-4 shadow-md lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-col lg:items-stretch lg:gap-y-6 lg:border-r lg:border-b-0 lg:p-6">
        <Link
          href="/dashboard"
          className="focus-visible:ring-ring text-background order-1 flex items-center gap-2.5 rounded-lg text-lg font-bold tracking-tight outline-none focus-visible:ring-2"
        >
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg shadow-xs">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" />
            </svg>
          </span>
          <span>
            Digital<span className="text-primary font-normal">Invitation</span>
          </span>
        </Link>

        <div className="order-3 w-full lg:order-2">
          <DashboardNav />
        </div>

        <div className="border-background/15 bg-background/5 order-2 ml-auto flex items-center gap-3 rounded-xl border p-3 lg:order-3 lg:mt-auto lg:ml-0 lg:w-full lg:min-w-0 lg:flex-col lg:items-stretch lg:gap-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-xs"
              >
                {initialsOf(user.name)}
              </span>
              <span className="ring-foreground absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2" />
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="text-background truncate text-sm font-semibold">{user.name}</p>
              <p className="text-background/60 truncate text-xs">{user.email}</p>
            </div>
          </div>
          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="border-background/25 text-background/80 hover:text-background hover:bg-background/15 focus-visible:ring-ring h-8 w-full rounded-lg border px-3 text-xs font-semibold whitespace-nowrap transition-all outline-none focus-visible:ring-2"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-4 py-8 sm:px-8 lg:py-10">{children}</main>
    </div>
  );
}
