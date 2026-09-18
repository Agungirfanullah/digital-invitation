import { describe, expect, it } from "vitest";

import { isProtectedPath } from "@/lib/supabase/route-protection";

describe("isProtectedPath", () => {
  it("protects the dashboard root", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
  });

  it("protects nested dashboard routes", () => {
    expect(isProtectedPath("/dashboard/events/123/guests")).toBe(true);
  });

  it("does not protect unrelated paths that merely share a prefix", () => {
    expect(isProtectedPath("/dashboardish")).toBe(false);
  });

  it("does not protect public routes", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/register")).toBe(false);
    expect(isProtectedPath("/invite/some-slug")).toBe(false);
  });
});
