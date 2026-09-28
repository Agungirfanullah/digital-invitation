import { describe, expect, it } from "vitest";

import { resolveAuthRateLimit } from "@/lib/auth/rate-limit";

const TEN_MINUTES = 10 * 60 * 1000;

describe("resolveAuthRateLimit", () => {
  it("uses the default login limit when no override is set", () => {
    expect(resolveAuthRateLimit("login", { E2E_TEST_MODE: "true" })).toEqual({
      limit: 30,
      windowMs: TEN_MINUTES,
    });
  });

  it('applies the E2E login override only when E2E_TEST_MODE is exactly "true"', () => {
    expect(
      resolveAuthRateLimit("login", { E2E_TEST_MODE: "true", E2E_AUTH_LOGIN_RATE_LIMIT: "500" }),
    ).toEqual({ limit: 500, windowMs: TEN_MINUTES });
  });

  it("never honors the override outside E2E_TEST_MODE, even if the override is set", () => {
    expect(
      resolveAuthRateLimit("login", { E2E_TEST_MODE: "false", E2E_AUTH_LOGIN_RATE_LIMIT: "500" }),
    ).toEqual({ limit: 30, windowMs: TEN_MINUTES });
  });

  it('fails closed: ignores the override for every E2E_TEST_MODE value other than exactly "true"', () => {
    for (const E2E_TEST_MODE of [undefined, "false", "1", "True", "TRUE", ""]) {
      expect(
        resolveAuthRateLimit("login", { E2E_TEST_MODE, E2E_AUTH_LOGIN_RATE_LIMIT: "500" }),
      ).toEqual({ limit: 30, windowMs: TEN_MINUTES });
    }
  });

  it("ignores the override when E2E_TEST_MODE is absent from the environment entirely", () => {
    expect(resolveAuthRateLimit("login", { E2E_AUTH_LOGIN_RATE_LIMIT: "500" }).limit).toBe(30);
  });

  it("is not fooled by a real deployment accidentally setting NODE_ENV=development — only E2E_TEST_MODE matters now", () => {
    expect(
      resolveAuthRateLimit("login", {
        NODE_ENV: "development",
        E2E_AUTH_LOGIN_RATE_LIMIT: "500",
      }).limit,
    ).toBe(30);
  });

  it("ignores malformed or non-positive override values", () => {
    for (const value of ["", "abc", "0", "-5", "12.5", "Infinity"]) {
      expect(
        resolveAuthRateLimit("login", { E2E_TEST_MODE: "true", E2E_AUTH_LOGIN_RATE_LIMIT: value })
          .limit,
      ).toBe(30);
    }
  });

  it("only affects the login bucket — register and password-reset stay fixed", () => {
    const env = { E2E_TEST_MODE: "true", E2E_AUTH_LOGIN_RATE_LIMIT: "500" };
    expect(resolveAuthRateLimit("register", env).limit).toBe(5);
    expect(resolveAuthRateLimit("password-reset", env).limit).toBe(5);
  });
});
