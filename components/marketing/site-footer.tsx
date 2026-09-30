import Link from "next/link";

/**
 * Homepage Footer (docs/PRD.md §8 item 14, D-073). Only links to routes
 * that actually exist — no fabricated About/Careers/Privacy/Terms pages
 * (none exist in this repository).
 */
export function SiteFooter() {
  return (
    <footer className="border-t px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-muted-foreground text-sm font-medium">Digital Invitation</p>
        <nav aria-label="Tautan akun" className="flex gap-4 text-sm">
          <Link href="/register" className="text-muted-foreground hover:text-foreground">
            Buat Akun
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Masuk
          </Link>
        </nav>
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} Digital Invitation.
        </p>
      </div>
    </footer>
  );
}
