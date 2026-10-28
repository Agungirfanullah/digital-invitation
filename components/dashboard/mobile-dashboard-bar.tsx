"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { signOutAction } from "@/lib/auth/actions";
import { NAV_ICONS } from "@/components/dashboard/dashboard-icons";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardLogo, UserBadge } from "@/components/dashboard/dashboard-brand";

/**
 * The dashboard's header below `lg`: logo, a shortcut to a new event, and a
 * drawer holding the same navigation and account controls as the desktop
 * sidebar. Closes when a link is followed, on Escape, and on the backdrop.
 */
export function MobileDashboardBar({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <header className="glass-panel border-border/60 sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4">
        <DashboardLogo />
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard/events/new"
            aria-label="Buat acara baru"
            className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-full shadow-sm"
          >
            <span className="size-4">{NAV_ICONS.plus}</span>
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((value) => !value)}
            className="text-foreground hover:bg-muted flex size-9 items-center justify-center rounded-full"
          >
            <span className="size-5">{open ? NAV_ICONS.close : NAV_ICONS.menu}</span>
          </button>
        </div>
      </header>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-14 z-30 bg-black/30 backdrop-blur-[2px]"
          />
          <div
            id={panelId}
            className="bg-card border-border/60 animate-fade-in-up fixed inset-x-0 top-14 z-40 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b px-4 pt-4 pb-5 shadow-xl"
          >
            <DashboardNav onNavigate={() => setOpen(false)} />
            <div className="border-border/60 mt-5 flex items-center justify-between gap-3 border-t pt-4">
              <UserBadge name={name} email={email} />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="border-border text-foreground hover:bg-muted flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium"
                >
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
