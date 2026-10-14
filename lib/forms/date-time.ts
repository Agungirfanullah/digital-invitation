/**
 * Pure helpers behind the date and time pickers. The app stores a date as
 * `YYYY-MM-DD` and a time as `HH:mm` (no timezone, see
 * lib/editor/validation.ts), and the pickers read and write exactly those
 * strings, so server validation and the database are untouched.
 */

export const TIME_SLOT_STEP_MINUTES = 15;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A local-midnight `Date` for `YYYY-MM-DD`, or `null` if it isn't a real calendar date. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  const match = value ? ISO_DATE.exec(value) : null;
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate ? date : null;
}

/** `YYYY-MM-DD` from the date's own local year/month/day — never via UTC, which shifts the day. */
export function toIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Every `HH:mm` of the day in `stepMinutes` steps, "00:00" through "23:45" by default. */
export function buildTimeSlots(stepMinutes: number = TIME_SLOT_STEP_MINUTES): string[] {
  const slots: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mins = String(minutes % 60).padStart(2, "0");
    slots.push(`${hours}:${mins}`);
  }
  return slots;
}

/**
 * Whether a slot may not be chosen because it is not strictly after `min`.
 * Mirrors the server rule `startTime < endTime` (lib/editor/validation.ts):
 * the end-time list passes the start time as `min`.
 */
export function isSlotUnavailable(slot: string, min: string | null | undefined): boolean {
  return Boolean(min) && slot <= (min as string);
}

/**
 * Which slot the list should land on when opened: the current value if it is
 * one of the slots, otherwise the first available slot after it (a value off
 * the 15-minute grid, e.g. an old "08:07", still gets a sensible position),
 * otherwise the first available slot.
 */
export function pickInitialSlot(
  slots: readonly string[],
  value: string | null | undefined,
  min: string | null | undefined,
): string | null {
  const available = slots.filter((slot) => !isSlotUnavailable(slot, min));
  if (available.length === 0) return null;
  if (value && available.includes(value)) return value;
  if (value) {
    const following = available.find((slot) => slot > value);
    if (following) return following;
  }
  return available[0];
}
