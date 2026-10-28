"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import { LogoMark } from "@/components/marketing/icons";

/**
 * The site logo, linking home. On the homepage itself a link to "/" is not
 * a navigation, so the click scrolls back to the top instead and drops any
 * section anchor (#harga, #faq…) from the address bar.
 */
export function BrandLogo({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  const backToTop = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/" || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    if (window.location.hash) window.history.replaceState(null, "", "/");
  };

  return (
    <Link
      href="/"
      onClick={backToTop}
      className={`group text-foreground flex items-center gap-2.5 font-semibold tracking-tight ${className}`}
    >
      <span className="from-primary flex size-8 items-center justify-center rounded-lg bg-gradient-to-br to-emerald-600 text-white shadow-sm shadow-emerald-900/20 transition-transform group-hover:scale-105">
        <LogoMark className="size-4" />
      </span>
      <span className="text-base font-bold tracking-tight">
        Digital<span className="text-primary font-medium">Invitation</span>
      </span>
    </Link>
  );
}
