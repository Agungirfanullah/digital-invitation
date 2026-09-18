import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EventDeleteBlockedError,
  EventNotFoundError,
  mapEventErrorMessage,
  SlugConflictError,
} from "@/lib/events/errors";

describe("mapEventErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps SlugConflictError to an Indonesian slug-taken message", () => {
    expect(mapEventErrorMessage(new SlugConflictError())).toMatch(/slug/i);
  });

  it("maps EventNotFoundError to an Indonesian not-found message", () => {
    expect(mapEventErrorMessage(new EventNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("maps EventDeleteBlockedError to an Indonesian dependency message", () => {
    expect(mapEventErrorMessage(new EventDeleteBlockedError())).toMatch(/tidak dapat dihapus/i);
  });

  it("falls back to a generic message and logs unexpected errors without leaking details", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapEventErrorMessage(new Error('relation "event" violates something internal'));

    expect(message).not.toMatch(/relation/i);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalled();
  });
});
