import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FileTooLargeError,
  GalleryStorageDeletionError,
  ImageDimensionsExceededError,
  UnsupportedFileTypeError,
  mapStorageErrorMessage,
} from "@/lib/storage/errors";

describe("mapStorageErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps FileTooLargeError to an Indonesian message including the MB limit", () => {
    const message = mapStorageErrorMessage(new FileTooLargeError(5 * 1024 * 1024));
    expect(message).toMatch(/5MB/);
  });

  it("maps UnsupportedFileTypeError to an Indonesian message", () => {
    expect(mapStorageErrorMessage(new UnsupportedFileTypeError())).toMatch(/JPEG|PNG|WebP|GIF/);
  });

  it("maps ImageDimensionsExceededError to an Indonesian message including the pixel limit", () => {
    const message = mapStorageErrorMessage(new ImageDimensionsExceededError(8000));
    expect(message).toMatch(/8000px/);
  });

  it("maps GalleryStorageDeletionError to an Indonesian retry message", () => {
    expect(mapStorageErrorMessage(new GalleryStorageDeletionError())).toMatch(/menghapus/i);
  });

  it("falls back to a generic message and logs unexpected errors without leaking a raw provider error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const message = mapStorageErrorMessage(
      new Error("SupabaseStorageApiError: bucket credentials invalid xyz123"),
    );

    expect(message).not.toMatch(/xyz123/);
    expect(message).not.toMatch(/credentials/);
    expect(message).toMatch(/kesalahan/i);
    expect(spy).toHaveBeenCalled();
  });
});
