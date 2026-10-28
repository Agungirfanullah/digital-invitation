import { ScrollTopLink } from "@/components/navigation/scroll-top-link";

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]);
  return letters.join("").toUpperCase() || "?";
}

/** The dashboard logo, linking to Beranda; on Beranda it scrolls back to the top. */
export function DashboardLogo() {
  return (
    <ScrollTopLink
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
    </ScrollTopLink>
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
