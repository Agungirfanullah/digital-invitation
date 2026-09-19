/** Formats an ISO date (YYYY-MM-DD) as a long Indonesian date, e.g. "12 Desember 2026". */
export function formatIndonesianDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Formats an "HH:mm" pair as a range, e.g. "08:00 - 10:00". No timezone
 * label is added — the schema stores a bare time with no zone, and
 * assuming WIB would be wrong for events outside western Indonesia.
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  if (startTime === endTime) return startTime;
  return `${startTime} - ${endTime}`;
}

const SHORT_MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Formats a full timestamp (e.g. `RSVP.submittedAt`) as a short Indonesian
 * date + time, e.g. "12 Des 2026, 14.30" — distinct from
 * `formatIndonesianDate()`, which only ever receives a bare `YYYY-MM-DD`
 * schedule date with no time component.
 *
 * Built manually (not via `toLocaleString`) so the output is deterministic
 * regardless of the runtime's ICU data, and reads the timestamp in UTC —
 * same explicit choice `formatIndonesianDate()` already makes — rather
 * than the server process's local timezone, which would silently differ
 * between a developer's machine and production and isn't necessarily WIB
 * either way.
 */
export function formatIndonesianDateTime(date: Date): string {
  const day = date.getUTCDate();
  const month = SHORT_MONTHS_ID[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}.${minutes} UTC`;
}
