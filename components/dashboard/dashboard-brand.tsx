import Link from "next/link";

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]);
  return letters.join("").toUpperCase() || "?";
}

export function DashboardLogo() {
  return (
    <Link
      href="/dashboard"
      className="focus-visible:ring-ring text-foreground flex items-center gap-2.5 rounded-lg font-bold tracking-tight outline-none focus-visible:ring-2"
    >
      <span className="from-primary flex size-8 items-center justify-center rounded-lg bg-gradient-to-br to-emerald-600 text-white shadow-sm">
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
      <span className="text-base">
        Digital<span className="text-primary font-medium">Invitation</span>
      </span>
    </Link>
  );
}

export function UserBadge({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="from-primary flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br to-emerald-600 text-xs font-bold text-white"
      >
        {initialsOf(name)}
      </span>
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-semibold">{name}</p>
        <p className="text-muted-foreground truncate text-xs">{email}</p>
      </div>
    </div>
  );
}
