import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Minimal public Homepage header (docs/PRD.md §7, D-073 §19) — no
 * authenticated dashboard navigation is duplicated here; it only ever
 * links into the existing `/login`/`ctaHref` entry points.
 */
export function SiteHeader({ ctaHref }: { ctaHref: string }) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/40 glass-panel px-6 py-3.5 transition-all">
      <div className="flex items-center gap-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold tracking-tight text-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4.5"
              aria-hidden="true"
            >
              <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" />
            </svg>
          </span>
          <span className="text-base font-bold tracking-tight">
            Digital<span className="text-primary font-normal">Invitation</span>
          </span>
        </Link>

        <nav aria-label="Navigasi bagian" className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a
            href="#template-showcase"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Template
          </a>
          <a
            href="#benefits-heading"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Keunggulan
          </a>
          <a
            href="#how-it-works-heading"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Cara Kerja
          </a>
          <a
            href="#pricing-heading"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Harga
          </a>
          <a
            href="#faq-heading"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </a>
        </nav>
      </div>

      <nav aria-label="Navigasi utama" className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-muted-foreground hover:text-foreground px-2 py-1 text-sm font-medium transition-colors"
        >
          Masuk
        </Link>
        <Button asChild size="sm" className="shadow-sm hover:shadow-md transition-shadow">
          <Link href={ctaHref}>Buat Undangan</Link>
        </Button>
      </nav>
    </header>
  );
}
