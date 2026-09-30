import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Minimal public Homepage header (docs/PRD.md §7, D-073 §19) — no
 * authenticated dashboard navigation is duplicated here; it only ever
 * links into the existing `/login`/`ctaHref` entry points.
 */
export function SiteHeader({ ctaHref }: { ctaHref: string }) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <Link href="/" className="font-semibold tracking-tight">
        Digital Invitation
      </Link>
      <nav aria-label="Navigasi utama" className="flex items-center gap-3">
        <Link href="/login" className="text-muted-foreground hover:text-foreground text-sm">
          Masuk
        </Link>
        <Button asChild size="sm">
          <Link href={ctaHref}>Buat Undangan</Link>
        </Button>
      </nav>
    </header>
  );
}
