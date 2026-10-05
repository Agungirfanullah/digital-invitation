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
/**
 * Builds a Google Calendar "add event" template link for a schedule.
 * Deliberately emits dates with NO trailing "Z" (`YYYYMMDDTHHmmss`, not
 * `YYYYMMDDTHHmmssZ`) — Google's add-event template treats a date without
 * a zone suffix as a "floating" local time, resolved in whichever
 * timezone the person who clicks the link is in. That's the same
 * no-assumed-timezone stance `formatTimeRange()`'s doc comment already
 * takes (the schema stores a bare `HH:mm` with no zone — assuming WIB
 * would be wrong for an event outside western Indonesia), carried through
 * here rather than guessing a UTC offset.
 */
export function buildGoogleCalendarUrl(schedule: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: { name: string; address: string } | null;
}): string {
  const toCompact = (time: string) =>
    `${schedule.date.replace(/-/g, "")}T${time.replace(":", "")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: schedule.title,
    dates: `${toCompact(schedule.startTime)}/${toCompact(schedule.endTime)}`,
  });
  if (schedule.venue) {
    params.set("location", `${schedule.venue.name}, ${schedule.venue.address}`);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Builds a safe instagram.com profile link from a free-text handle field
 * (identity `instagram` columns have no format validation beyond a max
 * length — see `lib/editor/validation.ts` — so this tolerates a leading
 * "@", stray whitespace, or a pasted full profile URL instead of a bare
 * handle). Always resolves to instagram.com regardless of input, so
 * there's no injection concern the way trusting an arbitrary URL as-is
 * would have (see `lib/invitations/url-safety.ts`'s doc comment).
 */
export function toInstagramProfileUrl(rawHandle: string): string {
  const withoutUrlPrefix = rawHandle.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  const handle = withoutUrlPrefix.replace(/^@+/, "").replace(/\/+$/, "").trim();
  return `https://instagram.com/${encodeURIComponent(handle)}`;
}

export function formatIndonesianDateTime(date: Date): string {
  const day = date.getUTCDate();
  const month = SHORT_MONTHS_ID[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}.${minutes} UTC`;
}
