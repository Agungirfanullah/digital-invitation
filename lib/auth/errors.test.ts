import { afterEach, describe, expect, it, vi } from "vitest";

import { mapSupabaseAuthError } from "@/lib/auth/errors";

describe("mapSupabaseAuthError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a generic message for null/undefined errors", () => {
    expect(mapSupabaseAuthError(null)).toMatch(/kesalahan/i);
    expect(mapSupabaseAuthError(undefined)).toMatch(/kesalahan/i);
  });

  it("maps known error codes to Indonesian messages", () => {
    expect(
      mapSupabaseAuthError({ code: "invalid_credentials", message: "Invalid login credentials" }),
    ).toBe("Email atau kata sandi salah.");
    expect(mapSupabaseAuthError({ code: "user_already_exists", message: "exists" })).toMatch(
      /sudah terdaftar/,
    );
  });

  it("falls back to a generic message and logs unknown codes without leaking them to the caller", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapSupabaseAuthError({
      code: "some_unknown_code",
      message: "raw internal detail",
    });

    expect(message).not.toMatch(/raw internal detail/);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalledWith(
      "[auth] Supabase auth error",
      expect.objectContaining({ code: "some_unknown_code" }),
    );
  });
});
