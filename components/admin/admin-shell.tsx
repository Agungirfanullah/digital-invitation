import type { ReactNode } from "react";
import Link from "next/link";

import { ADMIN_TABS } from "@/lib/admin/labels";
import { PageHeader } from "@/components/dashboard/page-header";

/** Shared frame of every admin page: title, a badge, and the admin tabs. */
export function AdminShell({
  active,
  title,
  description,
  children,
}: {
  active: (typeof ADMIN_TABS)[number]["href"];
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800">
            Mode admin
          </span>
        }
      />
      <nav aria-label="Menu admin" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        {ADMIN_TABS.map((tab) => {
          const isActive = tab.href === active;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`focus-visible:ring-ring shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 ${
                isActive
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}

/** Previous/next links for a paged admin list, keeping the other query params. */
export function Pager({
  page,
  pages,
  basePath,
  params,
}: {
  page: number;
  pages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    query.set("page", String(target));
    return `${basePath}?${query.toString()}`;
  };
  return (
    <nav aria-label="Halaman" className="flex items-center justify-between gap-3 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="text-primary font-medium hover:underline">
          ← Sebelumnya
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted-foreground tabular-nums">
        Halaman {page} dari {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="text-primary font-medium hover:underline">
          Berikutnya →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Search box for admin lists (a GET form, so results are linkable). */
export function AdminSearch({
  basePath,
  q,
  placeholder,
  children,
}: {
  basePath: string;
  q?: string;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <form action={basePath} className="flex flex-wrap gap-2" role="search">
      <label htmlFor="admin-q" className="sr-only">
        Cari
      </label>
      <input
        id="admin-q"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="border-input bg-card focus-visible:ring-ring h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
      />
      {children}
      <button
        type="submit"
        className="bg-primary text-primary-foreground h-10 rounded-lg px-4 text-sm font-medium"
      >
        Cari
      </button>
    </form>
  );
}
