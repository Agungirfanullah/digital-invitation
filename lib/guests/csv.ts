/**
 * Minimal RFC4180-style CSV parser/serializer, hand-rolled rather than a
 * new dependency: the format is small and fixed (guest import/export
 * columns only), and a bounded, well-tested parser here is simpler than
 * vetting and wiring an external library for it. Handles quoted fields
 * (embedded commas/newlines/escaped `""`), CRLF and LF line endings, and
 * ignores a trailing blank line.
 */

const FORMULA_TRIGGER_CHARS = new Set(["=", "+", "-", "@", "\t", "\r"]);

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      pushRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  // Final field/row, unless the file ended cleanly on a newline (in which
  // case the loop already pushed everything and this would add a bogus
  // empty trailing row).
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/**
 * Escapes a single CSV cell. Quotes it whenever it contains a comma,
 * quote, or newline. Also neutralizes a leading formula-trigger character
 * (`=`, `+`, `-`, `@`) with a leading apostrophe — CSV injection defense
 * for spreadsheet apps (Excel/Sheets execute a leading `=...` as a
 * formula), since this file may later be reopened in one after export.
 */
function escapeCell(value: string): string {
  let safe = value;
  if (FORMULA_TRIGGER_CHARS.has(safe[0])) {
    safe = `'${safe}`;
  }
  if (/[",\n]/.test(safe)) {
    safe = `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}
