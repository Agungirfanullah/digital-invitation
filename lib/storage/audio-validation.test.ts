import { describe, expect, it } from "vitest";

import { sniffAudioFormat, validateMusicUpload } from "@/lib/storage/audio-validation";
import { FileTooLargeError, UnsupportedFileTypeError } from "@/lib/storage/errors";
import { MUSIC_UPLOAD_MAX_BYTES } from "@/lib/invitations/music";

const ID3_MP3 = Buffer.concat([Buffer.from("ID3"), Buffer.alloc(40, 1)]);
const FRAME_MP3 = Buffer.concat([Buffer.from([0xff, 0xfb, 0x90, 0x64]), Buffer.alloc(40, 0)]);
const M4A = Buffer.concat([
  Buffer.from([0, 0, 0, 0x20]),
  Buffer.from("ftypM4A "),
  Buffer.alloc(40, 0),
]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(40, 0),
]);

function upload(name: string, type: string, buffer: Buffer) {
  return validateMusicUpload({ name, type, size: buffer.length, buffer });
}

describe("music upload validation", () => {
  it("recognizes MP3 (ID3 tag or frame sync) and M4A from the bytes", () => {
    expect(sniffAudioFormat(ID3_MP3)).toBe("mp3");
    expect(sniffAudioFormat(FRAME_MP3)).toBe("mp3");
    expect(sniffAudioFormat(M4A)).toBe("m4a");
    expect(sniffAudioFormat(PNG)).toBeNull();
  });

  it("accepts real MP3 and M4A files", () => {
    expect(upload("lagu.mp3", "audio/mpeg", ID3_MP3).contentType).toBe("audio/mpeg");
    expect(upload("lagu.m4a", "audio/mp4", M4A).contentType).toBe("audio/mp4");
  });

  it("refuses an image renamed to .mp3, a mismatched extension, and other types", () => {
    expect(() => upload("lagu.mp3", "audio/mpeg", PNG)).toThrow(UnsupportedFileTypeError);
    expect(() => upload("lagu.m4a", "audio/mpeg", ID3_MP3)).toThrow(UnsupportedFileTypeError);
    expect(() => upload("lagu.wav", "audio/wav", ID3_MP3)).toThrow(UnsupportedFileTypeError);
  });

  it("refuses files over the size limit or whose size does not match their bytes", () => {
    const big = Buffer.concat([ID3_MP3, Buffer.alloc(MUSIC_UPLOAD_MAX_BYTES)]);
    expect(() => upload("lagu.mp3", "audio/mpeg", big)).toThrow(FileTooLargeError);
    expect(() =>
      validateMusicUpload({ name: "lagu.mp3", type: "audio/mpeg", size: 10, buffer: ID3_MP3 }),
    ).toThrow(FileTooLargeError);
  });
});
