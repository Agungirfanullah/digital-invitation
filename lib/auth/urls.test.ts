import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getAppUrl, getAuthCallbackUrl, isSafeRedirectPath } from "@/lib/auth/urls";

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  process.env = {
    ...process.env,
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("isSafeRedirectPath", () => {
  it("accepts a relative path", () => {
    expect(isSafeRedirectPath("/dashboard")).toBe(true);
  });

  it("rejects a protocol-relative path (open redirect vector)", () => {
    expect(isSafeRedirectPath("//evil.com")).toBe(false);
  });

  it("rejects an absolute URL", () => {
    expect(isSafeRedirectPath("https://evil.com")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isSafeRedirectPath(undefined)).toBe(false);
    expect(isSafeRedirectPath(null)).toBe(false);
    expect(isSafeRedirectPath(42)).toBe(false);
  });
});

describe("getAppUrl", () => {
  it("strips a trailing slash", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000/";
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});

describe("getAuthCallbackUrl", () => {
  it("builds a callback URL with the encoded next param", () => {
    expect(getAuthCallbackUrl("/dashboard")).toBe(
      "http://localhost:3000/auth/callback?next=%2Fdashboard",
    );
  });

  it("falls back to /dashboard when next is unsafe", () => {
    expect(getAuthCallbackUrl("https://evil.com")).toBe(
      "http://localhost:3000/auth/callback?next=%2Fdashboard",
    );
  });
});
