import { describe, expect, it } from "vitest";

import { resolveAuthRateLimit } from "@/lib/auth/rate-limit";

const TEN_MINUTES = 10 * 60 * 1000;

describe("resolveAuthRateLimit", () => {
  it("uses the default login limit when no override is set", () => {
    expect(resolveAuthRateLimit("login", { NODE_ENV: "development" })).toEqual({
      limit: 30,
      windowMs: TEN_MINUTES,
    });
  });

  it("applies the E2E login override only when NODE_ENV is development", () => {
    expect(
      resolveAuthRateLimit("login", { NODE_ENV: "development", E2E_AUTH_LOGIN_RATE_LIMIT: "500" }),
    ).toEqual({ limit: 500, windowMs: TEN_MINUTES });
  });

  it("never honors the override in production, even if it is set", () => {
    expect(
      resolveAuthRateLimit("login", { NODE_ENV: "production", E2E_AUTH_LOGIN_RATE_LIMIT: "500" }),
    ).toEqual({ limit: 30, windowMs: TEN_MINUTES });
  });

  it("fails closed: ignores the override for every NODE_ENV other than development", () => {
    for (const NODE_ENV of [undefined, "test", "staging", "production", "Production", ""]) {
      expect(resolveAuthRateLimit("login", { NODE_ENV, E2E_AUTH_LOGIN_RATE_LIMIT: "500" })).toEqual(
        { limit: 30, windowMs: TEN_MINUTES },
      );
    }
  });

  it("ignores the override when NODE_ENV is absent from the environment entirely", () => {
    expect(resolveAuthRateLimit("login", { E2E_AUTH_LOGIN_RATE_LIMIT: "500" }).limit).toBe(30);
  });

  it("ignores malformed or non-positive override values", () => {
    for (const value of ["", "abc", "0", "-5", "12.5", "Infinity"]) {
      expect(
        resolveAuthRateLimit("login", { NODE_ENV: "development", E2E_AUTH_LOGIN_RATE_LIMIT: value })
          .limit,
      ).toBe(30);
    }
  });

  it("only affects the login bucket — register and password-reset stay fixed", () => {
    const env = { NODE_ENV: "development", E2E_AUTH_LOGIN_RATE_LIMIT: "500" };
    expect(resolveAuthRateLimit("register", env).limit).toBe(5);
    expect(resolveAuthRateLimit("password-reset", env).limit).toBe(5);
  });
});
