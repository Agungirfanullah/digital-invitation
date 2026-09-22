import { describe, expect, it } from "vitest";

import {
  classifyDeviceType,
  getAnalyticsSessionCookieOptions,
  isPublicInvitationPath,
  normalizeReferrer,
} from "@/lib/analytics/session";

describe("isPublicInvitationPath", () => {
  it("matches /invite and nested paths", () => {
    expect(isPublicInvitationPath("/invite")).toBe(true);
    expect(isPublicInvitationPath("/invite/my-wedding")).toBe(true);
  });

  it("does not match unrelated or lookalike paths", () => {
    expect(isPublicInvitationPath("/dashboard")).toBe(false);
    expect(isPublicInvitationPath("/invitextra")).toBe(false);
    expect(isPublicInvitationPath("/")).toBe(false);
  });
});

describe("classifyDeviceType", () => {
  it("returns UNKNOWN for a missing user agent", () => {
    expect(classifyDeviceType(null)).toBe("UNKNOWN");
    expect(classifyDeviceType(undefined)).toBe("UNKNOWN");
    expect(classifyDeviceType("")).toBe("UNKNOWN");
  });

  it("classifies a tablet user agent", () => {
    expect(classifyDeviceType("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("TABLET");
    expect(classifyDeviceType("Mozilla/5.0 (Linux; Android 13; SM-X200) Tablet")).toBe("TABLET");
  });

  it("classifies a mobile user agent", () => {
    expect(classifyDeviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
      "MOBILE",
    );
    expect(classifyDeviceType("Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile")).toBe("MOBILE");
  });

  it("classifies a desktop user agent", () => {
    expect(classifyDeviceType("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("DESKTOP");
    expect(classifyDeviceType("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe("DESKTOP");
  });
});

describe("normalizeReferrer", () => {
  it("returns null for missing/empty input", () => {
    expect(normalizeReferrer(null)).toBeNull();
    expect(normalizeReferrer(undefined)).toBeNull();
    expect(normalizeReferrer("")).toBeNull();
  });

  it("reduces a full URL to just its origin", () => {
    expect(normalizeReferrer("https://wa.me/1234567890?text=hello")).toBe("https://wa.me");
    expect(normalizeReferrer("https://www.google.com/search?q=undangan")).toBe(
      "https://www.google.com",
    );
  });

  it("returns null for an unparseable value", () => {
    expect(normalizeReferrer("not a url")).toBeNull();
  });
});

describe("getAnalyticsSessionCookieOptions", () => {
  it("is HttpOnly, scoped to /invite, and Lax regardless of secure", () => {
    const options = getAnalyticsSessionCookieOptions(false);
    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/invite");
    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });

  it("sets secure=true when requested", () => {
    expect(getAnalyticsSessionCookieOptions(true).secure).toBe(true);
  });
});
