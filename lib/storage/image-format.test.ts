import { describe, expect, it } from "vitest";

import { sniffImageFormat } from "@/lib/storage/image-format";

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function buildPng(width: number, height: number): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const chunkHeader = Buffer.alloc(8); // length (unused by the sniffer) + "IHDR"
  chunkHeader.write("IHDR", 4, "ascii");
  const dims = Buffer.alloc(8);
  dims.writeUInt32BE(width, 0);
  dims.writeUInt32BE(height, 4);
  return Buffer.concat([signature, chunkHeader, dims]);
}

function buildGif(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(10);
  buffer.write("GIF89a", 0, "ascii");
  buffer.writeUInt16LE(width, 6);
  buffer.writeUInt16LE(height, 8);
  return buffer;
}

/** A minimal, structurally valid baseline JPEG: SOI, one APP0 (JFIF) segment, then SOF0 carrying width/height. */
function buildJpeg(width: number, height: number): Buffer {
  const soi = Buffer.from([0xff, 0xd8]);

  const app0Payload = Buffer.alloc(14);
  app0Payload.write("JFIF\0", 0, "ascii");
  app0Payload.writeUInt8(1, 5); // version major
  app0Payload.writeUInt8(1, 6); // version minor
  const app0 = Buffer.concat([Buffer.from([0xff, 0xe0]), Buffer.from([0x00, 0x10]), app0Payload]);

  const sof0Payload = Buffer.alloc(15);
  sof0Payload.writeUInt8(8, 0); // precision
  sof0Payload.writeUInt16BE(height, 1);
  sof0Payload.writeUInt16BE(width, 3);
  sof0Payload.writeUInt8(3, 5); // number of components
  sof0Payload.set([1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0], 6);
  const sof0 = Buffer.concat([Buffer.from([0xff, 0xc0]), Buffer.from([0x00, 0x11]), sof0Payload]);

  return Buffer.concat([soi, app0, sof0]);
}

function buildWebpVp8x(width: number, height: number): Buffer {
  const header = Buffer.alloc(30);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(22, 4); // file size field — not read by the sniffer
  header.write("WEBP", 8, "ascii");
  header.write("VP8X", 12, "ascii");
  header.writeUInt32LE(10, 16); // VP8X chunk payload size
  // byte 20: flags, bytes 21-23: reserved — left zeroed
  header.writeUIntLE(width - 1, 24, 3);
  header.writeUIntLE(height - 1, 27, 3);
  return header;
}

describe("sniffImageFormat", () => {
  it("recognizes a real PNG and reads its dimensions from IHDR", () => {
    const result = sniffImageFormat(Buffer.from(TINY_PNG_BASE64, "base64"));
    expect(result).toEqual({
      format: "png",
      extension: "png",
      contentType: "image/png",
      width: 1,
      height: 1,
    });
  });

  it("reads PNG dimensions from a hand-built header", () => {
    expect(sniffImageFormat(buildPng(800, 600))).toMatchObject({ width: 800, height: 600 });
  });

  it("recognizes a GIF and reads its dimensions", () => {
    expect(sniffImageFormat(buildGif(320, 240))).toEqual({
      format: "gif",
      extension: "gif",
      contentType: "image/gif",
      width: 320,
      height: 240,
    });
  });

  it("recognizes a baseline JPEG and reads its dimensions from SOF0", () => {
    expect(sniffImageFormat(buildJpeg(1024, 768))).toEqual({
      format: "jpeg",
      extension: "jpg",
      contentType: "image/jpeg",
      width: 1024,
      height: 768,
    });
  });

  it("recognizes a VP8X WebP and reads its dimensions", () => {
    expect(sniffImageFormat(buildWebpVp8x(400, 300))).toEqual({
      format: "webp",
      extension: "webp",
      contentType: "image/webp",
      width: 400,
      height: 300,
    });
  });

  it("recognizes a plain VP8 WebP by signature, without claiming dimensions it doesn't decode", () => {
    const header = Buffer.alloc(20);
    header.write("RIFF", 0, "ascii");
    header.writeUInt32LE(12, 4);
    header.write("WEBP", 8, "ascii");
    header.write("VP8 ", 12, "ascii");
    expect(sniffImageFormat(header)).toEqual({
      format: "webp",
      extension: "webp",
      contentType: "image/webp",
      width: null,
      height: null,
    });
  });

  it("rejects a plain text file", () => {
    expect(sniffImageFormat(Buffer.from("this is not an image, just text"))).toBeNull();
  });

  it("rejects an executable's real magic bytes (MZ / PE header) even though nothing claims it's one here", () => {
    // The Windows PE/MZ executable signature — the actual scenario this
    // module exists to catch: a client can claim `image/png` in a
    // multipart request's Content-Type regardless of the real bytes.
    const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    expect(sniffImageFormat(exe)).toBeNull();
  });

  it("rejects an empty buffer", () => {
    expect(sniffImageFormat(Buffer.alloc(0))).toBeNull();
  });

  it("rejects a truncated PNG signature", () => {
    expect(sniffImageFormat(Buffer.from([0x89, 0x50, 0x4e]))).toBeNull();
  });

  it("rejects a JPEG with no SOF marker at all (malformed/truncated)", () => {
    const soiOnly = Buffer.from([0xff, 0xd8, 0xff, 0xd9]); // SOI immediately followed by EOI
    expect(sniffImageFormat(soiOnly)).toBeNull();
  });
});
