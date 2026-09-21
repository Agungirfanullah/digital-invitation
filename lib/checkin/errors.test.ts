import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CheckInUnauthorizedError,
  EventNotFoundError,
  InvalidCheckInGuestError,
  mapCheckInErrorMessage,
} from "@/lib/checkin/errors";

describe("mapCheckInErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps InvalidCheckInGuestError to an Indonesian not-found message", () => {
    expect(mapCheckInErrorMessage(new InvalidCheckInGuestError())).toMatch(/tidak ditemukan/i);
  });

  it("maps CheckInUnauthorizedError to an Indonesian permission message", () => {
    expect(mapCheckInErrorMessage(new CheckInUnauthorizedError())).toMatch(/tidak memiliki izin/i);
  });

  it("maps EventNotFoundError to the shared Indonesian not-found message", () => {
    expect(mapCheckInErrorMessage(new EventNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("falls back to a generic message and logs unexpected errors without leaking details", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapCheckInErrorMessage(new Error("raw prisma stack trace: P2002 detail"));

    expect(message).not.toMatch(/P2002/);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalled();
  });
});
