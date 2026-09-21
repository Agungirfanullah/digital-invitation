import { describe, expect, it } from "vitest";

import {
  FileTooLargeError,
  ImageDimensionsExceededError,
  UnsupportedFileTypeError,
} from "@/lib/storage/errors";
import {
  GALLERY_MAX_DIMENSION_PX,
  GALLERY_UPLOAD_MAX_BYTES,
  validateGalleryImageUpload,
} from "@/lib/storage/validation";

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const TINY_PNG = Buffer.from(TINY_PNG_BASE64, "base64");

function buildOversizedPng(dimension: number): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const chunkHeader = Buffer.alloc(8);
  chunkHeader.write("IHDR", 4, "ascii");
  const dims = Buffer.alloc(8);
  dims.writeUInt32BE(dimension, 0);
  dims.writeUInt32BE(dimension, 4);
  return Buffer.concat([signature, chunkHeader, dims]);
}

describe("validateGalleryImageUpload", () => {
  it("accepts a genuinely valid PNG upload", () => {
    const result = validateGalleryImageUpload({
      name: "photo.png",
      type: "image/png",
      size: TINY_PNG.length,
      buffer: TINY_PNG,
    });
    expect(result.extension).toBe("png");
    expect(result.contentType).toBe("image/png");
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });

  it("rejects a file over the size limit", () => {
    expect(() =>
      validateGalleryImageUpload({
        name: "photo.png",
        type: "image/png",
        size: GALLERY_UPLOAD_MAX_BYTES + 1,
        buffer: Buffer.alloc(GALLERY_UPLOAD_MAX_BYTES + 1),
      }),
    ).toThrow(FileTooLargeError);
  });

  it("rejects a zero-byte file", () => {
    expect(() =>
      validateGalleryImageUpload({
        name: "photo.png",
        type: "image/png",
        size: 0,
        buffer: Buffer.alloc(0),
      }),
    ).toThrow(FileTooLargeError);
  });

  it("rejects a claimed size that doesn't match the real buffer length (defense against a spoofed size field)", () => {
    expect(() =>
      validateGalleryImageUpload({
        name: "photo.png",
        type: "image/png",
        size: 1, // real buffer is much larger than claimed
        buffer: TINY_PNG,
      }),
    ).toThrow(FileTooLargeError);
  });

  it("rejects an unsupported MIME type", () => {
    expect(() =>
      validateGalleryImageUpload({
        name: "photo.svg",
        type: "image/svg+xml",
        size: TINY_PNG.length,
        buffer: TINY_PNG,
      }),
    ).toThrow(UnsupportedFileTypeError);
  });

  it("rejects a MIME type not in the allowlist even if the extension looks image-like", () => {
    expect(() =>
      validateGalleryImageUpload({
        name: "payload.exe",
        type: "application/x-msdownload",
        size: 8,
        buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]),
      }),
    ).toThrow(UnsupportedFileTypeError);
  });

  it("rejects a mismatched extension for the claimed MIME type", () => {
    expect(() =>
      validateGalleryImageUpload({
        name: "photo.exe",
        type: "image/png",
        size: TINY_PNG.length,
        buffer: TINY_PNG,
      }),
    ).toThrow(UnsupportedFileTypeError);
  });

  it("rejects an executable renamed to look like an image, even with a matching claimed MIME type and extension (content sniff catches it)", () => {
    const exeBytes = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    expect(() =>
      validateGalleryImageUpload({
        name: "photo.png",
        type: "image/png",
        size: exeBytes.length,
        buffer: exeBytes,
      }),
    ).toThrow(UnsupportedFileTypeError);
  });

  it("rejects content whose real format doesn't match the claimed MIME type (a PNG mislabeled as image/jpeg)", () => {
    expect(() =>
      validateGalleryImageUpload({
        name: "photo.jpg",
        type: "image/jpeg",
        size: TINY_PNG.length,
        buffer: TINY_PNG,
      }),
    ).toThrow(UnsupportedFileTypeError);
  });

  it("rejects an image exceeding the maximum dimension", () => {
    const oversized = buildOversizedPng(GALLERY_MAX_DIMENSION_PX + 1);
    expect(() =>
      validateGalleryImageUpload({
        name: "huge.png",
        type: "image/png",
        size: oversized.length,
        buffer: oversized,
      }),
    ).toThrow(ImageDimensionsExceededError);
  });

  it("accepts an image exactly at the maximum dimension", () => {
    const atLimit = buildOversizedPng(GALLERY_MAX_DIMENSION_PX);
    const result = validateGalleryImageUpload({
      name: "big.png",
      type: "image/png",
      size: atLimit.length,
      buffer: atLimit,
    });
    expect(result.width).toBe(GALLERY_MAX_DIMENSION_PX);
  });
});
