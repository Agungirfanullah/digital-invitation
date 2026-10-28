import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/marketing/icons";
import { MobileMenu } from "@/components/marketing/mobile-menu";
import { SECTION_LINKS } from "@/components/marketing/nav-links";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
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

/**
 * Public Homepage header (docs/PRD.md §7, D-073 §19) — no authenticated
 * dashboard navigation is duplicated here; it only ever links into the
 * existing `/login`/`ctaHref` entry points. Below `md` the section links
 * move into `MobileMenu`.
 */
export function SiteHeader({ ctaHref }: { ctaHref: string }) {
  return (
    <header className="glass-panel border-border/50 sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
        <BrandLogo />

        <nav aria-label="Navigasi bagian" className="hidden items-center gap-1 md:flex">
          {SECTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-full px-3.5 py-2 text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <nav aria-label="Navigasi utama" className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground hidden rounded-full px-3 py-2 text-sm font-medium transition-colors sm:block"
          >
            Masuk
          </Link>
          <Button asChild size="sm" className="rounded-full px-4 shadow-sm">
            <Link href={ctaHref}>Buat Undangan</Link>
          </Button>
          <MobileMenu />
        </nav>
      </div>
    </header>
  );
}
