import { describe, expect, it } from "vitest";

import { isSafeHttpUrl, toSafeHttpUrl } from "@/lib/invitations/url-safety";

describe("toSafeHttpUrl", () => {
  it("passes through a valid https URL", () => {
    expect(toSafeHttpUrl("https://example.com/photo.jpg")).toBe("https://example.com/photo.jpg");
  });

  it("passes through a valid http URL", () => {
    expect(toSafeHttpUrl("http://example.com")).toBe("http://example.com");
  });

  it("rejects a javascript: URL (XSS via <a href> on click)", () => {
    expect(toSafeHttpUrl("javascript:alert(document.cookie)")).toBeNull();
  });

  it("rejects a data: URL", () => {
    expect(toSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects a vbscript: URL", () => {
    expect(toSafeHttpUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("rejects a malformed string rather than throwing", () => {
    expect(toSafeHttpUrl("not a url at all")).toBeNull();
  });

  it("returns null for null/undefined/empty input", () => {
    expect(toSafeHttpUrl(null)).toBeNull();
    expect(toSafeHttpUrl(undefined)).toBeNull();
    expect(toSafeHttpUrl("")).toBeNull();
  });
});

describe("isSafeHttpUrl", () => {
  it("mirrors toSafeHttpUrl as a boolean", () => {
    expect(isSafeHttpUrl("https://example.com")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
  });
});
