import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, buildNonce, getSecurityHeaders } from "@/lib/security/headers";

const NONCE = "test-nonce-value";

describe("buildContentSecurityPolicy", () => {
  it("includes every required directive", () => {
    const csp = buildContentSecurityPolicy({ nonce: NONCE, isDev: false, isHttps: true });

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain(`script-src 'self' 'nonce-${NONCE}' 'strict-dynamic'`);
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' https: http: data: blob:");
    expect(csp).toContain("font-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("worker-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  it("intentionally retains unsafe-inline for style-src (theme inline styles)", () => {
    const csp = buildContentSecurityPolicy({ nonce: NONCE, isDev: false, isHttps: true });
    expect(csp).toMatch(/style-src [^;]*'unsafe-inline'/);
  });

  it("adds 'unsafe-eval' to script-src only in development", () => {
    const dev = buildContentSecurityPolicy({ nonce: NONCE, isDev: true, isHttps: false });
    const prod = buildContentSecurityPolicy({ nonce: NONCE, isDev: false, isHttps: true });

    expect(dev).toContain("'unsafe-eval'");
    expect(prod).not.toContain("'unsafe-eval'");
  });

  it("never appears twice for the same nonce value", () => {
    const csp = buildContentSecurityPolicy({ nonce: NONCE, isDev: false, isHttps: true });
    const occurrences = csp.split(`'nonce-${NONCE}'`).length - 1;
    expect(occurrences).toBe(1);
  });
});

describe("getSecurityHeaders", () => {
  it("includes the required baseline headers", () => {
    const headers = new Map(getSecurityHeaders({ nonce: NONCE, isDev: false, isHttps: true }));

    expect(headers.get("Content-Security-Policy")).toBeDefined();
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headers.get("Permissions-Policy")).toContain("camera=(self)");
  });

  it("allows camera for the QR check-in scanner but denies microphone/geolocation/payment", () => {
    const headers = new Map(getSecurityHeaders({ nonce: NONCE, isDev: false, isHttps: true }));
    const policy = headers.get("Permissions-Policy") ?? "";

    expect(policy).toContain("camera=(self)");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
    expect(policy).toContain("payment=()");
  });

  it("includes Strict-Transport-Security only when the request was HTTPS", () => {
    const httpsHeaders = new Map(getSecurityHeaders({ nonce: NONCE, isDev: false, isHttps: true }));
    const httpHeaders = new Map(getSecurityHeaders({ nonce: NONCE, isDev: false, isHttps: false }));

    expect(httpsHeaders.get("Strict-Transport-Security")).toBeDefined();
    expect(httpHeaders.has("Strict-Transport-Security")).toBe(false);
  });

  it("never includes an invitation token, guest id, or any header carrying request-specific data other than the nonce", () => {
    const headers = getSecurityHeaders({ nonce: NONCE, isDev: false, isHttps: true });
    const serialized = JSON.stringify(headers);

    // The nonce itself is expected to appear (that's its job); nothing
    // else request/user-specific should ever be present in these headers.
    expect(serialized).not.toMatch(/token|guestId|eventId|userId/i);
  });
});

describe("buildNonce", () => {
  it("produces a different value on every call", () => {
    const values = new Set(Array.from({ length: 20 }, () => buildNonce()));
    expect(values.size).toBe(20);
  });

  it("produces a non-empty base64-ish string", () => {
    const nonce = buildNonce();
    expect(nonce.length).toBeGreaterThan(0);
    expect(nonce).not.toContain(" ");
  });
});
