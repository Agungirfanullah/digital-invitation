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
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="bg-foreground text-background flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:flex-col lg:items-stretch lg:gap-y-6 lg:px-4 lg:py-6">
        <Link
          href="/dashboard"
          className="focus-visible:ring-ring order-1 rounded-md text-lg font-semibold tracking-tight outline-none focus-visible:ring-2"
        >
          Digital Invitation
        </Link>

        <div className="order-3 w-full lg:order-2">
          <DashboardNav />
        </div>

        <div className="order-2 ml-auto flex items-center gap-3 lg:order-3 lg:mt-auto lg:ml-0 lg:w-full lg:min-w-0 lg:flex-col lg:items-stretch">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            >
              {initialsOf(user.name)}
            </span>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-background/60 truncate text-xs">{user.email}</p>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="border-background/30 text-background hover:bg-background/10 focus-visible:ring-ring h-8 w-full rounded-md border px-3 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
