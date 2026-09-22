import { afterEach, describe, expect, it, vi } from "vitest";

import { EventNotFoundError, mapAnalyticsErrorMessage } from "@/lib/analytics/errors";

describe("mapAnalyticsErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps EventNotFoundError to the shared Indonesian not-found message", () => {
    expect(mapAnalyticsErrorMessage(new EventNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("falls back to a generic message and logs unexpected errors without leaking details", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapAnalyticsErrorMessage(new Error("raw prisma stack trace detail"));

    expect(message).not.toMatch(/prisma stack trace/);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalled();
  });
});
