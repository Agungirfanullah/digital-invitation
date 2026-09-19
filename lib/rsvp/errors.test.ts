import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EventNotFoundError,
  InvalidRsvpTokenError,
  SeatQuotaExceededError,
  mapRsvpErrorMessage,
} from "@/lib/rsvp/errors";

describe("mapRsvpErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps InvalidRsvpTokenError to an Indonesian message about using the personal link", () => {
    expect(mapRsvpErrorMessage(new InvalidRsvpTokenError())).toMatch(/tautan undangan pribadi/i);
  });

  it("maps SeatQuotaExceededError to a message including the seat quota", () => {
    expect(mapRsvpErrorMessage(new SeatQuotaExceededError(4))).toMatch(/4 orang/);
  });

  it("maps EventNotFoundError to the shared Indonesian not-found message", () => {
    expect(mapRsvpErrorMessage(new EventNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("falls back to a generic message and logs unexpected errors without leaking details", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapRsvpErrorMessage(new Error("some internal Prisma detail"));

    expect(message).not.toMatch(/Prisma/i);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalled();
  });
});
