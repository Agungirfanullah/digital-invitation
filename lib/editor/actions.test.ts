import { beforeEach, describe, expect, it, vi } from "vitest";

// jsdom's global File polyfill in this test environment doesn't implement
// `arrayBuffer()` (a real browser's File always does), which
// uploadGalleryImageAction calls even when validateGalleryImageUpload is
// mocked (it reads the real file body before handing it off). Patching
// the prototype here — rather than swapping in a different File class —
// keeps `file instanceof File` in the action's own code working correctly
// against jsdom's real global class; only the missing method is filled
// in, via FileReader (a jsdom-native API) rather than
// `new Response(this).arrayBuffer()` — the Response/fetch path goes
// through Node's undici stack, which intermittently failed this call
// under the heavier concurrent load of a full CI run (never locally),
// turning a should-succeed test into a false "ok: false". FileReader
// doesn't touch that stack at all.
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
const updateWeddingProfileMock = vi.fn();
const updateThemeMock = vi.fn();
const selectTemplateMock = vi.fn();
const createScheduleMock = vi.fn();
const addGalleryItemMock = vi.fn();
const uploadGalleryImageMock = vi.fn();
const moveGalleryItemMock = vi.fn();
const updateGalleryItemCaptionMock = vi.fn();
const checkGalleryUploadRateLimitMock = vi.fn();
const validateGalleryImageUploadMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args),
}));

vi.mock("@/lib/editor/service", () => ({
  updateWeddingProfile: (...args: unknown[]) => updateWeddingProfileMock(...args),
  updateTheme: (...args: unknown[]) => updateThemeMock(...args),
  selectTemplate: (...args: unknown[]) => selectTemplateMock(...args),
  createSchedule: (...args: unknown[]) => createScheduleMock(...args),
  addGalleryItem: (...args: unknown[]) => addGalleryItemMock(...args),
  uploadGalleryImage: (...args: unknown[]) => uploadGalleryImageMock(...args),
  moveGalleryItem: (...args: unknown[]) => moveGalleryItemMock(...args),
  updateGalleryItemCaption: (...args: unknown[]) => updateGalleryItemCaptionMock(...args),
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

import {
  addGalleryItemAction,
  createScheduleAction,
  moveGalleryItemAction,
  saveThemeAction,
  saveWeddingProfileAction,
  selectTemplateAction,
  updateGalleryItemCaptionAction,
  uploadGalleryImageAction,
} from "@/lib/editor/actions";

// File-scoped, not nested in a single describe — both the original
// describe block and the newer "uploadGalleryImageAction" block below
// need these mocks reset the same way.
beforeEach(() => {
  requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
  updateWeddingProfileMock.mockReset();
  updateThemeMock.mockReset();
  selectTemplateMock.mockReset();
  createScheduleMock.mockReset();
  addGalleryItemMock.mockReset();
  uploadGalleryImageMock.mockReset();
  moveGalleryItemMock.mockReset();
  updateGalleryItemCaptionMock.mockReset();
  checkGalleryUploadRateLimitMock.mockReset().mockResolvedValue(true);
  validateGalleryImageUploadMock.mockReset();
});

describe("editor actions — server-side validation and authorization", () => {
  it("saveWeddingProfileAction rejects an invalid payload without checking auth or calling the service", async () => {
    const result = await saveWeddingProfileAction("event-1", { brideFullName: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors).toBeDefined();
    expect(requireAppUserMock).not.toHaveBeenCalled();
    expect(updateWeddingProfileMock).not.toHaveBeenCalled();
  });

  it("saveWeddingProfileAction requires an authenticated session before calling the service", async () => {
    updateWeddingProfileMock.mockResolvedValue({ brideFullName: "Ayu" });

    const result = await saveWeddingProfileAction("event-1", {
      brideFullName: "Ayu",
      brideNickname: null,
      brideFather: null,
      brideMother: null,
      brideInstagram: null,
      groomFullName: null,
      groomNickname: null,
      groomFather: null,
      groomMother: null,
      groomInstagram: null,
    });

    expect(result.ok).toBe(true);
    expect(requireAppUserMock).toHaveBeenCalledTimes(1);
    // The authenticated user's id — never a client-supplied value — is
    // what gets passed down to the service layer.
    expect(updateWeddingProfileMock).toHaveBeenCalledWith("event-1", "user-1", expect.anything());
  });

  it("saveThemeAction rejects a CSS-injection-shaped color without calling the service", async () => {
    const result = await saveThemeAction("event-1", {
      primaryColor: "red; } body { display:none",
      secondaryColor: null,
      backgroundColor: null,
      textColor: null,
      accentColor: null,
      headingFont: null,
      bodyFont: null,
      scriptFont: null,
      backgroundImageUrl: null,
    });

    expect(result.ok).toBe(false);
    expect(updateThemeMock).not.toHaveBeenCalled();
  });

  it("saveThemeAction rejects a javascript: background image URL without calling the service", async () => {
    const result = await saveThemeAction("event-1", {
      primaryColor: null,
      secondaryColor: null,
      backgroundColor: null,
      textColor: null,
      accentColor: null,
      headingFont: null,
      bodyFont: null,
      scriptFont: null,
      backgroundImageUrl: "javascript:alert(1)",
    });

    expect(result.ok).toBe(false);
    expect(updateThemeMock).not.toHaveBeenCalled();
  });

  it("selectTemplateAction rejects a malformed payload without calling the service", async () => {
    const result = await selectTemplateAction("event-1", { templateSlug: 42 });
    expect(result.ok).toBe(false);
    expect(selectTemplateMock).not.toHaveBeenCalled();
  });

  it("createScheduleAction rejects an end time before the start time without calling the service", async () => {
    const result = await createScheduleAction("event-1", {
      title: "Akad Nikah",
      description: null,
      date: "2026-12-12",
      startTime: "10:00",
      endTime: "08:00",
      venueName: null,
      venueAddress: null,
      venueMapUrl: null,
      venueLatitude: null,
      venueLongitude: null,
    });

    expect(result.ok).toBe(false);
    expect(createScheduleMock).not.toHaveBeenCalled();
  });

  it("createScheduleAction nests flat venue fields before calling the service", async () => {
    createScheduleMock.mockResolvedValue({ id: "sch-1" });

    await createScheduleAction("event-1", {
      title: "Akad Nikah",
      description: null,
      date: "2026-12-12",
      startTime: "08:00",
      endTime: "10:00",
      venueName: "Gedung Serbaguna",
      venueAddress: "Jl. Uji Coba No. 1",
      venueMapUrl: null,
      venueLatitude: null,
      venueLongitude: null,
    });

    expect(createScheduleMock).toHaveBeenCalledWith(
      "event-1",
      "user-1",
      expect.objectContaining({
        venue: expect.objectContaining({ name: "Gedung Serbaguna", address: "Jl. Uji Coba No. 1" }),
      }),
    );
  });

  it("addGalleryItemAction rejects type IMAGE without calling the service — image items only go through uploadGalleryImageAction", async () => {
    const result = await addGalleryItemAction("event-1", {
      type: "IMAGE",
      url: "https://example.com/a.jpg",
      caption: null,
    });

    expect(result.ok).toBe(false);
    expect(addGalleryItemMock).not.toHaveBeenCalled();
  });

  it("updateGalleryItemCaptionAction rejects a caption over 200 characters without calling the service", async () => {
    const result = await updateGalleryItemCaptionAction("event-1", "item-1", {
      caption: "a".repeat(201),
    });

    expect(result.ok).toBe(false);
    expect(updateGalleryItemCaptionMock).not.toHaveBeenCalled();
  });

  it("updateGalleryItemCaptionAction passes the authenticated user's id, not a client-supplied one", async () => {
    updateGalleryItemCaptionMock.mockResolvedValue({ id: "item-1", caption: "Baru" });

    await updateGalleryItemCaptionAction("event-1", "item-1", { caption: "Baru" });

    expect(updateGalleryItemCaptionMock).toHaveBeenCalledWith(
      "event-1",
      "user-1",
      "item-1",
      "Baru",
    );
  });

  it("moveGalleryItemAction requires authentication before calling the service", async () => {
    moveGalleryItemMock.mockResolvedValue([]);

    await moveGalleryItemAction("event-1", "item-1", "up");

    expect(requireAppUserMock).toHaveBeenCalledTimes(1);
    expect(moveGalleryItemMock).toHaveBeenCalledWith("event-1", "user-1", "item-1", "up");
  });
});

describe("uploadGalleryImageAction", () => {
  function testFile(): File {
    return new File([new Uint8Array([1, 2, 3, 4])], "photo.png", { type: "image/png" });
  }

  it("returns a rate-limit error without validating or calling the service when rate-limited", async () => {
    checkGalleryUploadRateLimitMock.mockResolvedValue(false);
    const formData = new FormData();
    formData.set("file", testFile());

    const result = await uploadGalleryImageAction("event-1", formData);

    expect(result.ok).toBe(false);
    expect(validateGalleryImageUploadMock).not.toHaveBeenCalled();
    expect(uploadGalleryImageMock).not.toHaveBeenCalled();
  });

  it("rejects a request with no file field without calling the service", async () => {
    const formData = new FormData();

    const result = await uploadGalleryImageAction("event-1", formData);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors?.file).toBeDefined();
    expect(uploadGalleryImageMock).not.toHaveBeenCalled();
  });

  it("rejects a caption over 200 characters without calling the service", async () => {
    const formData = new FormData();
    formData.set("file", testFile());
    formData.set("caption", "a".repeat(201));

    const result = await uploadGalleryImageAction("event-1", formData);

    expect(result.ok).toBe(false);
    expect(uploadGalleryImageMock).not.toHaveBeenCalled();
  });

  it("maps a thrown validation error to a safe message without calling the service", async () => {
    const { UnsupportedFileTypeError } = await import("@/lib/storage/errors");
    validateGalleryImageUploadMock.mockImplementation(() => {
      throw new UnsupportedFileTypeError();
    });
    const formData = new FormData();
    formData.set("file", testFile());

    const result = await uploadGalleryImageAction("event-1", formData);

    expect(result.ok).toBe(false);
    expect(uploadGalleryImageMock).not.toHaveBeenCalled();
  });

  it("passes the authenticated user's id and the validated image to the service on success", async () => {
    const validated = { buffer: Buffer.from([1]), extension: "png", contentType: "image/png" };
    validateGalleryImageUploadMock.mockReturnValue(validated);
    uploadGalleryImageMock.mockResolvedValue({ id: "item-1" });

    const formData = new FormData();
    formData.set("file", testFile());
    formData.set("caption", "Momen bahagia");

    const result = await uploadGalleryImageAction("event-1", formData);

    expect(result.ok).toBe(true);
    expect(uploadGalleryImageMock).toHaveBeenCalledWith(
      "event-1",
      "user-1",
      validated,
      "Momen bahagia",
    );
  });
});
