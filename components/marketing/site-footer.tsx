import Link from "next/link";

/**
 * Homepage Footer (docs/PRD.md §8 item 14, D-073). Only links to routes
 * that actually exist — no fabricated About/Careers/Privacy/Terms pages
 * (none exist in this repository).
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/40 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs">
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
          <span className="font-bold tracking-tight text-foreground text-sm">
            Digital<span className="text-primary font-normal">Invitation</span>
          </span>
        </div>

        <nav aria-label="Tautan akun" className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/register"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Buat Akun
          </Link>
          <Link
            href="/login"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Masuk
          </Link>
        </nav>

        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} Digital Invitation · Platform Undangan Digital Indonesia
        </p>
      </div>
    </footer>
  );
}
