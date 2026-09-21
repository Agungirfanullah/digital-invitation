import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EventNotFoundError,
  InvalidWishTokenError,
  WishLimitExceededError,
  WishNotFoundError,
  mapWishErrorMessage,
} from "@/lib/wishes/errors";

describe("mapWishErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps InvalidWishTokenError to an Indonesian message about the personal invitation link", () => {
    expect(mapWishErrorMessage(new InvalidWishTokenError())).toMatch(/tautan undangan pribadi/i);
  });

  it("maps WishLimitExceededError to an Indonesian message without leaking the numeric limit as a stack trace", () => {
    const message = mapWishErrorMessage(new WishLimitExceededError(3));
    expect(message).toMatch(/batas maksimal/i);
  });

  it("maps WishNotFoundError to an Indonesian not-found message", () => {
    expect(mapWishErrorMessage(new WishNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("maps EventNotFoundError to the shared Indonesian not-found message", () => {
    expect(mapWishErrorMessage(new EventNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("falls back to a generic message and logs unexpected errors without leaking details", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapWishErrorMessage(new Error("raw internal wish content: secret message"));

    expect(message).not.toMatch(/secret message/);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalled();
  });
});
