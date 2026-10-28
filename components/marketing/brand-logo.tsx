import { LogoMark } from "@/components/marketing/icons";
import { ScrollTopLink } from "@/components/navigation/scroll-top-link";

/** The site logo, linking home; on the homepage it scrolls back to the top. */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <ScrollTopLink
      href="/"
      className={`group text-foreground flex items-center gap-2.5 font-semibold tracking-tight ${className}`}
    >
      <span className="from-primary flex size-8 items-center justify-center rounded-lg bg-gradient-to-br to-emerald-600 text-white shadow-sm shadow-emerald-900/20 transition-transform group-hover:scale-105">
        <LogoMark className="size-4" />
      </span>
      <span className="text-base font-bold tracking-tight">
        Digital<span className="text-primary font-medium">Invitation</span>
      </span>
    </ScrollTopLink>
  );
}
