import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EventNotFoundError,
  GiftMethodNotFoundError,
  mapGiftErrorMessage,
} from "@/lib/gifts/errors";

describe("mapGiftErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps GiftMethodNotFoundError to an Indonesian not-found message", () => {
    expect(mapGiftErrorMessage(new GiftMethodNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("maps EventNotFoundError to the shared Indonesian not-found message", () => {
    expect(mapGiftErrorMessage(new EventNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("falls back to a generic message and logs unexpected errors without leaking details", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapGiftErrorMessage(new Error("account number: 1234567890"));

    expect(message).not.toMatch(/1234567890/);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalled();
  });
});
