/**
 * Server-side magic-byte format/dimension sniffing for uploaded images.
 * Deliberately hand-rolled instead of a dimension-reading dependency
 * (e.g. `image-size`) — see docs/DECISIONS.md D-043: this is validation
 * logic (a few dozen lines, no image decoding/transcoding), not the
 * "custom image-processing infrastructure" the task explicitly warns
 * against building.
 *
 * This is the actual authenticity check against a spoofed MIME type: a
 * client can claim `Content-Type: image/png` for any byte stream, but it
 * cannot make an executable's bytes start with a real PNG/JPEG/GIF/WebP
 * signature. Detection here is what a file is actually rejected or
 * accepted on — the client-supplied `type`/`name` are never trusted alone
 * (see lib/storage/validation.ts).
 */

export type SniffedImageFormat = "png" | "jpeg" | "gif" | "webp";

export interface SniffedImage {
  format: SniffedImageFormat;
  extension: string;
  contentType: string;
  /** `null` when the format was genuinely authenticated but this parser doesn't decode its dimensions (see the WebP VP8/VP8L note below). */
  width: number | null;
  height: number | null;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function readPng(buffer: Buffer): SniffedImage | null {
  if (buffer.length < 24) return null;
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  if (buffer.toString("ascii", 12, 16) !== "IHDR") return null;

  return {
    format: "png",
    extension: "png",
    contentType: "image/png",
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readGif(buffer: Buffer): SniffedImage | null {
  if (buffer.length < 10) return null;
  const header = buffer.toString("ascii", 0, 6);
  if (header !== "GIF87a" && header !== "GIF89a") return null;

  return {
    format: "gif",
    extension: "gif",
    contentType: "image/gif",
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
  };
}

// SOF markers that carry a width/height field. Excludes 0xC4 (DHT), 0xC8
// (JPG extension, unused), and 0xCC (DAC) — those aren't Start-Of-Frame
// segments even though they fall in the 0xC0-0xCF range.
const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);
// Markers with no length-prefixed payload to skip over.
const JPEG_NO_PAYLOAD_MARKERS = new Set([0x01, 0xd8]);

function readJpeg(buffer: Buffer): SniffedImage | null {
  if (buffer.length < 4) return null;
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let pos = 2;
  // Bounded scan — a well-formed JPEG's SOF appears within the first
  // handful of segments (APP0/EXIF/etc.); this cap prevents an
  // adversarial or corrupt file from spinning the loop indefinitely.
  const MAX_ITERATIONS = 2000;

  for (let i = 0; i < MAX_ITERATIONS && pos + 1 < buffer.length; i++) {
    if (buffer[pos] !== 0xff) return null;
    const marker = buffer[pos + 1];

    if (marker >= 0xd0 && marker <= 0xd7) {
      pos += 2;
      continue;
    }
    if (JPEG_NO_PAYLOAD_MARKERS.has(marker)) {
      pos += 2;
      continue;
    }
    if (pos + 3 >= buffer.length) return null;
    const segmentLength = buffer.readUInt16BE(pos + 2);

    if (JPEG_SOF_MARKERS.has(marker)) {
      if (pos + 8 >= buffer.length) return null;
      return {
        format: "jpeg",
        extension: "jpg",
        contentType: "image/jpeg",
        height: buffer.readUInt16BE(pos + 5),
        width: buffer.readUInt16BE(pos + 7),
      };
    }

    if (marker === 0xda) return null; // Start-of-Scan reached with no SOF seen — malformed.
    pos += 2 + segmentLength;
  }

  return null;
}

function readWebp(buffer: Buffer): SniffedImage | null {
  if (buffer.length < 16) return null;
  if (buffer.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buffer.toString("ascii", 8, 12) !== "WEBP") return null;

  const chunkType = buffer.toString("ascii", 12, 16);
  const base = { format: "webp" as const, extension: "webp", contentType: "image/webp" };

  // VP8X (extended format, most common from modern export tools):
  // width-1 / height-1 are 24-bit little-endian at fixed offsets.
  if (chunkType === "VP8X" && buffer.length >= 30) {
    const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
    const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
    return { ...base, width, height };
  }

  // Plain VP8 (lossy) / VP8L (lossless): a real WebP file, format
  // authenticated by the RIFF/WEBP/chunk-type signature above, but this
  // parser doesn't decode their bit-packed dimension fields — dimension
  // bounds are not enforced for these two subtypes (see
  // docs/DECISIONS.md D-043's documented scope limit). Format/size/MIME
  // checks still fully apply.
  if (chunkType === "VP8 " || chunkType === "VP8L") {
    return { ...base, width: null, height: null };
  }

  return null;
}

/**
 * Returns `null` for anything that isn't a recognized image signature —
 * the caller must treat that as "reject," never falling back to trusting
 * the client-supplied MIME type or file extension.
 */
export function sniffImageFormat(buffer: Buffer): SniffedImage | null {
  return readPng(buffer) ?? readGif(buffer) ?? readJpeg(buffer) ?? readWebp(buffer);
}
