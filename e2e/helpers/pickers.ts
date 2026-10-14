import { expect, type Page } from "@playwright/test";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MAX_MONTHS_TO_PAGE = 120;

/**
 * Chooses `isoDate` (YYYY-MM-DD) in the date picker named `label` the way a
 * person does: open the calendar, page to the right month, click the day.
 */
export async function pickDate(page: Page, label: string, isoDate: string): Promise<void> {
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthName = MONTH_NAMES[month - 1];

  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const caption = dialog.getByText(`${monthName} ${year}`, { exact: true });
  for (let step = 0; step < MAX_MONTHS_TO_PAGE && !(await caption.isVisible()); step += 1) {
    const target = new Date(year, month - 1, 1).getTime();
    const shown = await dialog.getByRole("grid").getAttribute("aria-label");
    const shownMonth = MONTH_NAMES.findIndex((name) => shown?.startsWith(name));
    const shownYear = Number(shown?.split(" ").pop());
    const current = new Date(shownYear, shownMonth, 1).getTime();
    await dialog
      .getByRole("button", {
        name: target > current ? "Ke bulan berikutnya" : "Ke bulan sebelumnya",
      })
      .click();
  }
  await expect(caption).toBeVisible();

  await dialog.getByRole("button", { name: new RegExp(`\\b${day} ${monthName} ${year}`) }).click();
  await expect(dialog).toBeHidden();
}

/** Chooses `time` (HH:mm, a 15-minute slot) in the time picker named `label`. */
export async function pickTime(page: Page, label: string, time: string): Promise<void> {
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
  await page.getByRole("option", { name: time, exact: true }).click();
  await expect(page.getByRole("listbox")).toBeHidden();
}
