"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

/**
 * A link that, when it points at the page already open, scrolls back to the
 * top instead (a same-path link is not a navigation, so it would otherwise
 * do nothing) and drops any section anchor from the address bar. Used by
 * the site and dashboard logos.
 */
export function ScrollTopLink({
  href,
  onClick,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const pathname = usePathname();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (pathname !== href || event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    if (window.location.hash) window.history.replaceState(null, "", href);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
