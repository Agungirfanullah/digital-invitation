import type { CSSProperties } from "react";

import { resolveReadableForeground } from "@/lib/invitations/color-contrast";
import type { PublicTheme } from "@/lib/invitations/types";

/**
 * Exposes the resolved theme as CSS custom properties on a wrapping
 * element, so section components can reference `var(--ii-primary)` etc.
 * via Tailwind arbitrary values (e.g. `text-[var(--ii-primary)]`) instead
 * of needing the theme threaded through every component's props.
 *
 * Also rescopes the shared shadcn/dashboard design tokens
 * (`--primary`, `--background`, `--border`, etc.) to this same theme,
 * *within this element's own subtree only* — CSS custom properties
 * cascade, so this override never reaches the dashboard elsewhere. This
 * is the entire fix for `RsvpForm`/`WishForm`/`CopyValueButton` (they use
 * the shared `Button`/`Input`/`Textarea` components, which read exactly
 * these variable names) rendering with the invitation's own theme instead
 * of the dashboard's default palette — with zero changes to those
 * components themselves (docs/DECISIONS.md). `--destructive`/
 * `--destructive-foreground` are deliberately left alone: an error state
 * should stay recognizable as "error" regardless of which template is
 * active, not be reinterpreted through an arbitrary event palette.
 */
export function themeToCssVars(theme: PublicTheme): CSSProperties {
  const onPrimary = resolveReadableForeground(theme.primaryColor, theme.textColor);
  const onSecondary = resolveReadableForeground(theme.secondaryColor, theme.textColor);
  const onAccent = resolveReadableForeground(theme.accentColor, theme.textColor);

  return {
    "--ii-primary": theme.primaryColor,
    "--ii-secondary": theme.secondaryColor,
    "--ii-background": theme.backgroundColor,
    "--ii-text": theme.textColor,
    "--ii-accent": theme.accentColor,
    "--ii-muted": theme.secondaryColor,
    "--ii-heading-font": theme.headingFont,
    "--ii-body-font": theme.bodyFont,
    "--ii-script-font": theme.scriptFont,

    "--background": theme.backgroundColor,
    "--foreground": theme.textColor,
    "--card": theme.backgroundColor,
    "--card-foreground": theme.textColor,
    "--primary": theme.primaryColor,
    "--primary-foreground": onPrimary,
    "--secondary": theme.secondaryColor,
    "--secondary-foreground": onSecondary,
    "--accent": theme.accentColor,
    "--accent-foreground": onAccent,
    "--muted": theme.secondaryColor,
    "--muted-foreground": theme.textColor,
    "--border": theme.secondaryColor,
    "--input": theme.secondaryColor,
    "--ring": theme.accentColor,
  } as CSSProperties;
}
