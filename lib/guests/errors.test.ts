import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CsvTooLargeError,
  EventNotFoundError,
  GuestNotFoundError,
  mapGuestErrorMessage,
} from "@/lib/guests/errors";

describe("mapGuestErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps GuestNotFoundError to an Indonesian not-found message", () => {
    expect(mapGuestErrorMessage(new GuestNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("maps EventNotFoundError to the shared Indonesian not-found message", () => {
    expect(mapGuestErrorMessage(new EventNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("maps CsvTooLargeError to an Indonesian message mentioning the row limit", () => {
    expect(mapGuestErrorMessage(new CsvTooLargeError())).toMatch(/500/);
  });

  it("falls back to a generic message and logs unexpected errors without leaking details", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapGuestErrorMessage(new Error("some internal Prisma detail"));

    expect(message).not.toMatch(/Prisma/i);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalled();
  });
});
