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
const uploadIdentityPhotoMock = vi.fn();
const removeIdentityPhotoMock = vi.fn();
const checkGalleryUploadRateLimitMock = vi.fn();
const validateGalleryImageUploadMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args),
}));

vi.mock("@/lib/editor/service", () => ({
  uploadIdentityPhoto: (...args: unknown[]) => uploadIdentityPhotoMock(...args),
  removeIdentityPhoto: (...args: unknown[]) => removeIdentityPhotoMock(...args),
}));

vi.mock("@/lib/editor/gallery-rate-limit", () => ({
  checkGalleryUploadRateLimit: (...args: unknown[]) => checkGalleryUploadRateLimitMock(...args),
}));

vi.mock("@/lib/storage/validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage/validation")>();
  return {
    ...actual,
    validateGalleryImageUpload: (...args: unknown[]) => validateGalleryImageUploadMock(...args),
  };
});

import { removeIdentityPhotoAction, uploadIdentityPhotoAction } from "@/lib/editor/actions";
import { IdentityPhotoNotOwnedError } from "@/lib/editor/errors";

beforeEach(() => {
  requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
  uploadIdentityPhotoMock.mockReset();
  removeIdentityPhotoMock.mockReset();
  checkGalleryUploadRateLimitMock.mockReset().mockResolvedValue(true);
  validateGalleryImageUploadMock.mockReset();
});

function formWithFile(extra: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("file", new File([new Uint8Array(10)], "a.png", { type: "image/png" }));
  for (const [key, value] of Object.entries(extra)) formData.set(key, value);
  return formData;
}

describe("uploadIdentityPhotoAction", () => {
  it("refuses once the user's upload rate limit is used up, before reading the file", async () => {
    checkGalleryUploadRateLimitMock.mockResolvedValue(false);

    const result = await uploadIdentityPhotoAction("event-1", formWithFile());

    expect(result.ok).toBe(false);
    expect(validateGalleryImageUploadMock).not.toHaveBeenCalled();
    expect(uploadIdentityPhotoMock).not.toHaveBeenCalled();
  });

  it("asks for a file when none was sent", async () => {
    const result = await uploadIdentityPhotoAction("event-1", new FormData());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.file).toBeDefined();
    expect(uploadIdentityPhotoMock).not.toHaveBeenCalled();
  });

  it("returns the file problem, not a technical error, when image validation fails", async () => {
    validateGalleryImageUploadMock.mockImplementation(() => {
      throw new Error("not an image");
    });

    const result = await uploadIdentityPhotoAction("event-1", formWithFile());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.file?.[0]).toBeTruthy();
      expect(result.error).not.toContain("not an image");
    }
    expect(uploadIdentityPhotoMock).not.toHaveBeenCalled();
  });

  it("uploads with the authenticated user's id and the photo being replaced", async () => {
    const validated = { extension: "png", contentType: "image/png", buffer: Buffer.alloc(1) };
    validateGalleryImageUploadMock.mockReturnValue(validated);
    uploadIdentityPhotoMock.mockResolvedValue({ publicUrl: "https://storage.example/new.png" });

    const result = await uploadIdentityPhotoAction(
      "event-1",
      formWithFile({ previousUrl: "https://storage.example/old.png" }),
    );

    expect(result).toEqual({ ok: true, data: { publicUrl: "https://storage.example/new.png" } });
    expect(uploadIdentityPhotoMock).toHaveBeenCalledWith(
      "event-1",
      "user-1",
      validated,
      "https://storage.example/old.png",
    );
  });

  it("maps a service failure to a safe message", async () => {
    validateGalleryImageUploadMock.mockReturnValue({ extension: "png" });
    uploadIdentityPhotoMock.mockRejectedValue(new Error("connection string leaked here"));

    const result = await uploadIdentityPhotoAction("event-1", formWithFile());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).not.toContain("connection string");
  });
});

describe("removeIdentityPhotoAction", () => {
  it("removes through the service as the authenticated user", async () => {
    removeIdentityPhotoMock.mockResolvedValue(undefined);

    const result = await removeIdentityPhotoAction("event-1", "https://storage.example/a.png");

    expect(result).toEqual({ ok: true, data: null });
    expect(removeIdentityPhotoMock).toHaveBeenCalledWith(
      "event-1",
      "user-1",
      "https://storage.example/a.png",
    );
  });

  it("explains a rejected photo in Indonesian", async () => {
    removeIdentityPhotoMock.mockRejectedValue(new IdentityPhotoNotOwnedError());

    const result = await removeIdentityPhotoAction("event-1", "https://x.example/a.png");

    expect(result).toEqual({ ok: false, error: "Foto tidak valid. Unggah ulang fotonya." });
  });
});
