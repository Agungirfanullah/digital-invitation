import type { ReactNode } from "react";

import { requireAppUser } from "@/lib/auth/session";
import { signOutAction } from "@/lib/auth/actions";
import { DashboardLogo, UserBadge } from "@/components/dashboard/dashboard-brand";
import { NAV_ICONS } from "@/components/dashboard/dashboard-icons";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { MobileDashboardBar } from "@/components/dashboard/mobile-dashboard-bar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireAppUser();

  return (
    <div className="bg-muted/30 flex min-h-screen flex-1">
      <aside className="bg-card border-border/60 sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r px-4 py-5 lg:flex">
        <div className="px-2">
          <DashboardLogo />
        </div>

        <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
          <DashboardNav />
        </div>

        <div className="border-border/60 mt-4 space-y-3 border-t pt-4">
          <div className="px-1">
            <UserBadge name={user.name} email={user.email} />
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2"
            >
              <span className="size-[18px] shrink-0">{NAV_ICONS.logout}</span>
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileDashboardBar name={user.name} email={user.email} />
        <main className="flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
