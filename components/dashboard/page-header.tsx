import type { ReactNode } from "react";
import Link from "next/link";

/**
 * The shared top of every dashboard page: an optional link back to the
 * parent page, the page title (the page's only `<h1>`), a short
 * description, and the page's main actions on the right.
 */
export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="space-y-3">
      {back && (
        <Link
          href={back.href}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex max-w-full items-center gap-1.5 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-4 shrink-0"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
          <span className="truncate">{back.label}</span>
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** A white, bordered panel — the dashboard's basic content container. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-border/60 bg-card rounded-2xl border shadow-xs ${className}`}>
      {children}
    </div>
  );
}
