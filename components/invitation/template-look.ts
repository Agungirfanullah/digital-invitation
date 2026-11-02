import type { CSSProperties } from "react";

/**
 * How the sections every template shares (countdown, gallery, RSVP form,
 * desktop cover panel) adapt to the active template, so those sections do
 * not look identical across all templates. Presentation only: no data or
 * behavior depends on it.
 *
 * - `shape`: corner style of cards, photos and form controls.
 * - `countdown`: "photo" sits the countdown on the cover photo (cinematic,
 *   dark templates); "tint" uses the theme colors so the cover photo is not
 *   repeated mid-page.
 * - `panel`: layout of the desktop (lg+) cover panel.
 */
export type LookShape = "round" | "soft" | "square";
export type CountdownMood = "photo" | "tint";
export type PanelLayout = "ornate" | "plain" | "geometric" | "editorial" | "fullbleed";

export interface TemplateLook {
  shape: LookShape;
  countdown: CountdownMood;
  panel: PanelLayout;
}

const DEFAULT_LOOK: TemplateLook = { shape: "soft", countdown: "tint", panel: "ornate" };

const LOOKS: Record<string, TemplateLook> = {
  "minimal-elegant": { shape: "soft", countdown: "tint", panel: "geometric" },
  "modern-editorial": { shape: "square", countdown: "tint", panel: "editorial" },
  "floral-romance": { shape: "round", countdown: "tint", panel: "ornate" },
  "dark-luxury": { shape: "soft", countdown: "photo", panel: "fullbleed" },
  "traditional-nusantara": { shape: "soft", countdown: "tint", panel: "ornate" },
  "soft-romantic": { shape: "round", countdown: "tint", panel: "plain" },
  "cinematic-journey": { shape: "soft", countdown: "photo", panel: "fullbleed" },
  "rustic-earth": { shape: "round", countdown: "tint", panel: "ornate" },
  "playful-pop": { shape: "round", countdown: "tint", panel: "plain" },
  "royal-gold": { shape: "soft", countdown: "photo", panel: "ornate" },
  "blue-bloom": { shape: "round", countdown: "tint", panel: "ornate" },
  "mono-frame": { shape: "square", countdown: "tint", panel: "editorial" },
  "garden-tropical": { shape: "soft", countdown: "tint", panel: "ornate" },
  "art-deco": { shape: "square", countdown: "tint", panel: "geometric" },
  "vintage-sepia": { shape: "soft", countdown: "tint", panel: "ornate" },
  "industrial-loft": { shape: "square", countdown: "photo", panel: "editorial" },
  "traditional-jawa": { shape: "square", countdown: "tint", panel: "ornate" },
};

export function templateLook(templateKey: string | null): TemplateLook {
  return (templateKey && LOOKS[templateKey]) || DEFAULT_LOOK;
}

const RADIUS: Record<LookShape, string> = {
  round: "1.25rem",
  soft: "0.75rem",
  square: "0px",
};

/**
 * `--ii-radius` for the shared sections, set once by `InvitationRenderer`.
 * Shared components read it as `rounded-[var(--ii-radius)]`.
 */
export function templateLookVars(templateKey: string | null): CSSProperties {
  return { "--ii-radius": RADIUS[templateLook(templateKey).shape] } as CSSProperties;
}
