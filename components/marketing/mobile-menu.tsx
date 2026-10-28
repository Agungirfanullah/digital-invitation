"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { CloseIcon, MenuIcon } from "@/components/marketing/icons";
import { SECTION_LINKS } from "@/components/marketing/nav-links";

/** The site header's section links below `md`: a toggle and a drop-down panel. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Tutup menu" : "Buka menu"}
        onClick={() => setOpen((value) => !value)}
        className="text-foreground hover:bg-muted flex size-9 items-center justify-center rounded-full transition-colors"
      >
        {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
      </button>

      {open && (
        <div
          id={panelId}
          className="glass-panel border-border/50 animate-fade-in-up absolute inset-x-0 top-16 border-b px-5 pt-2 pb-5 shadow-lg"
        >
          <ul className="flex flex-col">
            {SECTION_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-foreground hover:bg-muted block rounded-xl px-3 py-3 text-base font-medium"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="border-border/60 mt-2 border-t pt-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-foreground hover:bg-muted block rounded-xl px-3 py-3 text-base font-medium"
              >
                Masuk
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
