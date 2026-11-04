import "server-only";

import { FileTooLargeError, UnsupportedFileTypeError } from "@/lib/storage/errors";
import { MUSIC_UPLOAD_MAX_BYTES } from "@/lib/invitations/music";

export interface ValidatedAudio {
  buffer: Buffer;
  extension: "mp3" | "m4a";
  contentType: "audio/mpeg" | "audio/mp4";
}

const CLAIMED_MIME: Record<string, ValidatedAudio["extension"]> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
};

/**
 * Identifies MP3 or M4A from the file's own bytes, never from its name or
 * claimed type: MP3 starts with an ID3 tag or an MPEG audio frame sync,
 * M4A has an `ftyp` box at offset 4 with an audio brand.
 */
export function sniffAudioFormat(buffer: Buffer): ValidatedAudio["extension"] | null {
  if (buffer.length < 12) return null;
  if (buffer.toString("latin1", 0, 3) === "ID3") return "mp3";
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return "mp3";
  if (buffer.toString("latin1", 4, 8) === "ftyp") {
    const brand = buffer.toString("latin1", 8, 12);
    if (["M4A ", "M4B ", "mp42", "isom", "mp41", "dash"].includes(brand)) return "m4a";
  }
  return null;
}

export function validateMusicUpload(input: {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
}): ValidatedAudio {
  if (
    input.size <= 0 ||
    input.size > MUSIC_UPLOAD_MAX_BYTES ||
    input.buffer.length !== input.size
  ) {
    throw new FileTooLargeError(MUSIC_UPLOAD_MAX_BYTES);
  }

  const claimed = CLAIMED_MIME[input.type];
  const extension = input.name.toLowerCase().split(".").pop();
  if (!claimed || extension !== claimed) throw new UnsupportedFileTypeError();

  const sniffed = sniffAudioFormat(input.buffer);
  if (sniffed !== claimed) throw new UnsupportedFileTypeError();

  return {
    buffer: input.buffer,
    extension: sniffed,
    contentType: sniffed === "mp3" ? "audio/mpeg" : "audio/mp4",
  };
}
