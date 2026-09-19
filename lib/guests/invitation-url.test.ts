import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildGuestInvitationUrl } from "@/lib/guests/invitation-url";

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

describe("buildGuestInvitationUrl", () => {
  it("builds the expected /invite/[slug]?to=[token] shape", () => {
    expect(buildGuestInvitationUrl("raka-dan-nadia", "abc123XYZ")).toBe(
      "http://localhost:3000/invite/raka-dan-nadia?to=abc123XYZ",
    );
  });

  it("strips a trailing slash from the configured app URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000/";
    expect(buildGuestInvitationUrl("raka-dan-nadia", "abc123")).toBe(
      "http://localhost:3000/invite/raka-dan-nadia?to=abc123",
    );
  });

  it("URL-encodes the token", () => {
    expect(buildGuestInvitationUrl("raka-dan-nadia", "a+b/c")).toBe(
      "http://localhost:3000/invite/raka-dan-nadia?to=a%2Bb%2Fc",
    );
  });

  it("uses a production https app URL as-is", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://undangan.example.com";
    expect(buildGuestInvitationUrl("raka-dan-nadia", "abc123")).toBe(
      "https://undangan.example.com/invite/raka-dan-nadia?to=abc123",
    );
  });

  it("throws rather than returning an unsafe URL when the app URL is misconfigured", () => {
    process.env.NEXT_PUBLIC_APP_URL = "javascript:alert(1)";
    expect(() => buildGuestInvitationUrl("raka-dan-nadia", "abc123")).toThrow();
  });
});
