import { beforeEach, describe, expect, it, vi } from "vitest";

// jsdom's File lacks arrayBuffer(); see lib/editor/actions.test.ts for why
// this is patched through FileReader.
if (typeof File.prototype.arrayBuffer !== "function") {
  File.prototype.arrayBuffer = function arrayBuffer(this: Blob) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
      reader.readAsArrayBuffer(this);
    });
  };
}

const requireAppUserMock = vi.fn();
const uploadEventMusicMock = vi.fn();
const checkGalleryUploadRateLimitMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args),
}));

vi.mock("@/lib/editor/service", () => ({
  uploadEventMusic: (...args: unknown[]) => uploadEventMusicMock(...args),
}));

vi.mock("@/lib/editor/gallery-rate-limit", () => ({
  checkGalleryUploadRateLimit: (...args: unknown[]) => checkGalleryUploadRateLimitMock(...args),
}));

import { uploadMusicAction } from "@/lib/editor/actions";
import { MUSIC_UPLOAD_MAX_BYTES } from "@/lib/invitations/music";
import { StorageProviderError } from "@/lib/storage/errors";

// Passes the MP3 signature check: an ID3 header plus padding.
const MP3_BYTES = new Uint8Array([0x49, 0x44, 0x33, ...new Array(64).fill(0)]);

function formWith(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return formData;
}

beforeEach(() => {
  requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
  uploadEventMusicMock.mockReset();
  checkGalleryUploadRateLimitMock.mockReset().mockResolvedValue(true);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("uploadMusicAction", () => {
  it("stays below Vercel's 4.5MB function body limit", () => {
    expect(MUSIC_UPLOAD_MAX_BYTES).toBeLessThan(4.5 * 1000 * 1000);
  });

  it("saves a valid MP3 with its file name as the title", async () => {
    uploadEventMusicMock.mockResolvedValue({ url: "u", title: "Lagu Kita", source: "upload" });

    const result = await uploadMusicAction(
      "event-1",
      formWith(new File([MP3_BYTES], "Lagu_Kita.mp3", { type: "audio/mpeg" })),
    );

    expect(result.ok).toBe(true);
    expect(uploadEventMusicMock).toHaveBeenCalledWith(
      "event-1",
      "user-1",
      expect.objectContaining({ contentType: "audio/mpeg" }),
      "Lagu Kita",
    );
  });

  it("explains a storage refusal instead of a generic error", async () => {
    uploadEventMusicMock.mockRejectedValue(
      new StorageProviderError(new Error("mime type audio/mpeg is not supported")),
    );

    const result = await uploadMusicAction(
      "event-1",
      formWith(new File([MP3_BYTES], "lagu.mp3", { type: "audio/mpeg" })),
    );

    expect(result).toEqual({
      ok: false,
      error: "Lagu gagal disimpan ke penyimpanan. Coba lagi sebentar lagi.",
    });
  });

  it("refuses a file that is not really audio before touching storage", async () => {
    const result = await uploadMusicAction(
      "event-1",
      formWith(new File([new Uint8Array(64)], "bukan-lagu.mp3", { type: "audio/mpeg" })),
    );

    expect(result.ok).toBe(false);
    expect(uploadEventMusicMock).not.toHaveBeenCalled();
  });
});
