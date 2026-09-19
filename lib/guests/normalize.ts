/**
 * Derives the value stored in `Guest.normalizedName`, used for matching
 * (search, duplicate detection) without touching the display `name` the
 * user typed. Lowercase + trim + collapse internal whitespace — nothing
 * more aggressive (no diacritic stripping), since Indonesian names are
 * matched as typed.
 */
export function normalizeGuestName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Digits-only view of a phone number, used only for duplicate comparison.
 * The original, user-entered format (e.g. "0812-3456-7890" or
 * "+62 812 3456 7890") is always what gets stored/displayed — this never
 * rewrites the stored value, per the instruction not to destroy useful
 * Indonesian contact formats.
 */
export function phoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Treat a leading "0" (common Indonesian local format) as equivalent to
  // the "62" country code for comparison purposes only, so "0812..." and
  // "+62812..." are recognized as the same number.
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}
