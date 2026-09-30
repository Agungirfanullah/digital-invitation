import type { Page } from "@playwright/test";

/**
 * Every published invitation now sits behind the Opening/Reveal gate
 * (docs/PRD.md §17, docs/DECISIONS.md D-069), which defaults to enabled.
 * Call this right after navigating to `/invite/[slug]...` and before
 * asserting on any invitation content — the content exists in the DOM but
 * is not visible/interactive until the gate is dismissed. Never needed in
 * the editor (its live preview bypasses the gate — see
 * `components/editor/editor-preview.tsx`).
 */
export async function revealInvitation(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Buka Undangan" }).click();
}
