import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const createEventForUserMock = vi.fn();
const updateEventForUserMock = vi.fn();
const deleteEventForUserMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args),
}));

vi.mock("@/lib/events/service", () => ({
  createEventForUser: (...args: unknown[]) => createEventForUserMock(...args),
  updateEventForUser: (...args: unknown[]) => updateEventForUserMock(...args),
  deleteEventForUser: (...args: unknown[]) => deleteEventForUserMock(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { resetRateLimit } from "@/lib/rate-limit";
import { createEventAction, updateEventAction } from "@/lib/events/actions";
import { EventTypeImmutableError } from "@/lib/events/errors";

// D-077: every action under test shares the real, un-mocked rate limiter
// (checkEventMutationRateLimit → consumeRateLimit), keyed by the mocked
// user id below — reset before each test so one test's calls never count
// toward another's limit.
function resetEventMutationRateLimit(userId = "user-1"): void {
  resetRateLimit(`event-mutation:${userId}`);
}

describe("createEventAction — server-side validation", () => {
  beforeEach(() => {
    requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
    createEventForUserMock.mockReset();
    resetEventMutationRateLimit();
  });

  it("rejects a title that is too short without calling the service layer", async () => {
    const formData = new FormData();
    formData.set("title", "ab");
    formData.set("type", "WEDDING");
    formData.set("slug", "valid-slug");

    const result = await createEventAction({}, formData);

    expect(result.fieldErrors?.title).toBeDefined();
    expect(createEventForUserMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid slug format without calling the service layer", async () => {
    const formData = new FormData();
    formData.set("title", "Judul Valid");
    formData.set("type", "WEDDING");
    formData.set("slug", "Invalid Slug!!");

    const result = await createEventAction({}, formData);

    expect(result.fieldErrors?.slug).toBeDefined();
    expect(createEventForUserMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown event type without calling the service layer", async () => {
    const formData = new FormData();
    formData.set("title", "Judul Valid");
    formData.set("type", "NOT_A_REAL_TYPE");
    formData.set("slug", "valid-slug");

    const result = await createEventAction({}, formData);

    expect(result.fieldErrors?.type).toBeDefined();
    expect(createEventForUserMock).not.toHaveBeenCalled();
  });

  it("always derives the owner from the authenticated session, never from form input", async () => {
    createEventForUserMock.mockResolvedValue({ id: "event-1" });
    const formData = new FormData();
    formData.set("title", "Judul Valid");
    formData.set("type", "WEDDING");
    formData.set("slug", "valid-slug");
    // A malicious/buggy client including an ownerId field must be ignored.
    formData.set("ownerId", "someone-elses-user-id");

    await expect(createEventAction({}, formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(createEventForUserMock).toHaveBeenCalledWith(
      "user-1",
      expect.not.objectContaining({ ownerId: expect.anything() }),
    );
  });
});

describe("updateEventAction — server-side validation", () => {
  beforeEach(() => {
    requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
    updateEventForUserMock.mockReset();
    resetEventMutationRateLimit();
  });

  it("rejects invalid input without calling the service layer", async () => {
    const formData = new FormData();
    formData.set("title", "ab");
    formData.set("type", "WEDDING");
    formData.set("slug", "valid-slug");

    const result = await updateEventAction("event-123", {}, formData);

    expect(result.fieldErrors?.title).toBeDefined();
    expect(updateEventForUserMock).not.toHaveBeenCalled();
  });

  it("accepts the edit form's payload, which carries no type field", async () => {
    updateEventForUserMock.mockResolvedValue({ id: "event-123" });
    const formData = new FormData();
    formData.set("title", "Judul Valid");
    formData.set("slug", "valid-slug");

    await expect(updateEventAction("event-123", {}, formData)).rejects.toThrow("NEXT_REDIRECT");
    expect(updateEventForUserMock).toHaveBeenCalledWith(
      "event-123",
      "user-1",
      expect.objectContaining({ type: undefined }),
    );
  });

  it("forwards a crafted type change to the service, which is what rejects it (not the UI)", async () => {
    updateEventForUserMock.mockRejectedValue(new EventTypeImmutableError());
    const formData = new FormData();
    formData.set("title", "Judul Valid");
    formData.set("slug", "valid-slug");
    formData.set("type", "BIRTHDAY");

    const result = await updateEventAction("event-123", {}, formData);

    expect(result.error).toBe("Jenis acara tidak dapat diubah setelah acara dibuat.");
  });
});

describe("event mutation rate limiting (D-077)", () => {
  function invalidFormData(): FormData {
    const formData = new FormData();
    formData.set("title", "ab"); // too short — fails validation without reaching the service
    formData.set("type", "WEDDING");
    formData.set("slug", "valid-slug");
    return formData;
  }

  function validFormData(): FormData {
    const formData = new FormData();
    formData.set("title", "Judul Valid");
    formData.set("type", "WEDDING");
    formData.set("slug", "valid-slug");
    return formData;
  }

  beforeEach(() => {
    requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
    createEventForUserMock.mockReset();
    resetEventMutationRateLimit("user-1");
    resetEventMutationRateLimit("user-2");
  });

  it("rejects the 31st request within the window, without calling the service, even with otherwise-valid input", async () => {
    for (let i = 0; i < 30; i += 1) {
      await createEventAction({}, invalidFormData());
    }

    const result = await createEventAction({}, validFormData());

    expect(result).toEqual({
      error: "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.",
    });
    expect(result.fieldErrors).toBeUndefined();
    expect(createEventForUserMock).not.toHaveBeenCalled();
  });

  it("does not reject a request before the limit is reached", async () => {
    for (let i = 0; i < 29; i += 1) {
      await createEventAction({}, invalidFormData());
    }

    const result = await createEventAction({}, invalidFormData());

    // Still the ordinary validation error, not the rate-limit error.
    expect(result.fieldErrors?.title).toBeDefined();
    expect(result.error).toBe("Periksa kembali data yang kamu masukkan.");
  });

  it("isolates rate limits per authenticated user — exhausting user-1's limit never affects user-2", async () => {
    for (let i = 0; i < 30; i += 1) {
      await createEventAction({}, invalidFormData());
    }
    const user1Result = await createEventAction({}, validFormData());
    expect(user1Result.error).toBe(
      "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.",
    );

    requireAppUserMock.mockResolvedValue({ id: "user-2" });
    const user2Result = await createEventAction({}, invalidFormData());

    // user-2 still gets the ordinary validation error, proving they were
    // never blocked by user-1's exhausted bucket.
    expect(user2Result.fieldErrors?.title).toBeDefined();
    expect(user2Result.error).toBe("Periksa kembali data yang kamu masukkan.");
  });
});
