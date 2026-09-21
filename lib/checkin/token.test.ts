import { describe, expect, it } from "vitest";

import { extractInvitationTokenFromScannedValue } from "@/lib/checkin/token";

const VALID_TOKEN = "a".repeat(32);

describe("extractInvitationTokenFromScannedValue", () => {
  it("extracts a valid token from a well-formed invitation URL", () => {
    const value = `https://example.com/invite/my-wedding?to=${VALID_TOKEN}`;
    expect(extractInvitationTokenFromScannedValue(value)).toBe(VALID_TOKEN);
  });

  it("extracts the token regardless of other query params or path shape", () => {
    const value = `https://example.com/invite/my-wedding?utm_source=x&to=${VALID_TOKEN}&foo=bar`;
    expect(extractInvitationTokenFromScannedValue(value)).toBe(VALID_TOKEN);
  });

  it("returns null for a non-URL scanned value", () => {
    expect(extractInvitationTokenFromScannedValue("not a url")).toBeNull();
    expect(extractInvitationTokenFromScannedValue(VALID_TOKEN)).toBeNull();
  });

  it("returns null when the URL has no `to` param", () => {
    expect(
      extractInvitationTokenFromScannedValue("https://example.com/invite/my-wedding"),
    ).toBeNull();
  });

  it("returns null when the `to` param fails token format validation", () => {
    expect(
      extractInvitationTokenFromScannedValue("https://example.com/invite/x?to=short"),
    ).toBeNull();
    expect(
      extractInvitationTokenFromScannedValue("https://example.com/invite/x?to=" + "!".repeat(32)),
    ).toBeNull();
  });

  it("returns null for an empty scanned value", () => {
    expect(extractInvitationTokenFromScannedValue("")).toBeNull();
  });

  it("never trusts the embedded slug — only the token param is read", () => {
    const value = `https://example.com/invite/some-other-event-slug?to=${VALID_TOKEN}`;
    expect(extractInvitationTokenFromScannedValue(value)).toBe(VALID_TOKEN);
  });
});
