import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EventNotFoundError,
  mapEditorErrorMessage,
  TemplateNotAvailableError,
} from "@/lib/editor/errors";

describe("mapEditorErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps EventNotFoundError to the shared Indonesian not-found message", () => {
    expect(mapEditorErrorMessage(new EventNotFoundError())).toMatch(/tidak ditemukan/i);
  });

  it("maps TemplateNotAvailableError to an Indonesian message", () => {
    expect(mapEditorErrorMessage(new TemplateNotAvailableError())).toMatch(/belum tersedia/i);
  });

  it("falls back to a generic message and logs unexpected errors without leaking details", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapEditorErrorMessage(new Error("some internal Prisma detail"));

    expect(message).not.toMatch(/Prisma/i);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalled();
  });
});
