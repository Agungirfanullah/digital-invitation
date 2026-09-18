import type { CSSProperties } from "react";

import type { PublicTheme } from "@/lib/invitations/types";

/**
 * Exposes the resolved theme as CSS custom properties on a wrapping
 * element, so section components can reference `var(--ii-primary)` etc.
 * via Tailwind arbitrary values (e.g. `text-[var(--ii-primary)]`) instead
 * of needing the theme threaded through every component's props.
 */
export function themeToCssVars(theme: PublicTheme): CSSProperties {
  return {
    "--ii-primary": theme.primaryColor,
    "--ii-secondary": theme.secondaryColor,
    "--ii-background": theme.backgroundColor,
    "--ii-text": theme.textColor,
    "--ii-accent": theme.accentColor,
    "--ii-heading-font": theme.headingFont,
    "--ii-body-font": theme.bodyFont,
    "--ii-script-font": theme.scriptFont,
  } as CSSProperties;
}
