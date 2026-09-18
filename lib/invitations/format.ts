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
