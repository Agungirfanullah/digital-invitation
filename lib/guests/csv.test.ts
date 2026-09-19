import { describe, expect, it } from "vitest";

import { parseCsv, toCsv } from "@/lib/guests/csv";

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles a quoted field containing a comma", () => {
    expect(parseCsv('"Doe, John",30')).toEqual([["Doe, John", "30"]]);
  });

  it("handles a quoted field containing an embedded newline", () => {
    expect(parseCsv('"line1\nline2",x')).toEqual([["line1\nline2", "x"]]);
  });

  it("handles an escaped double-quote inside a quoted field", () => {
    expect(parseCsv('"She said ""hi""",x')).toEqual([['She said "hi"', "x"]]);
  });

  it("ignores a trailing blank line", () => {
    expect(parseCsv("a,b\n1,2\n\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("handles a file with no trailing newline", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("toCsv", () => {
  it("joins rows with CRLF and cells with commas", () => {
    expect(
      toCsv([
        ["a", "b"],
        ["1", "2"],
      ]),
    ).toBe("a,b\r\n1,2");
  });

  it("quotes a cell containing a comma", () => {
    expect(toCsv([["Doe, John"]])).toBe('"Doe, John"');
  });

  it("escapes an embedded double-quote", () => {
    expect(toCsv([['He said "hi"']])).toBe('"He said ""hi"""');
  });

  it("neutralizes a leading formula-trigger character (CSV injection defense)", () => {
    expect(toCsv([["=SUM(1+1)"]])).toBe("'=SUM(1+1)");
  });

  it("round-trips a table through toCsv and parseCsv", () => {
    const table = [
      ["nama", "telepon", "catatan"],
      ["Budi, S.Kom", "0812-3456-7890", 'Suka disebut "Budi kecil"'],
    ];
    expect(parseCsv(toCsv(table))).toEqual(table);
  });
});
