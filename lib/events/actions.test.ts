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

import { createEventAction, updateEventAction } from "@/lib/events/actions";

describe("createEventAction — server-side validation", () => {
  beforeEach(() => {
    requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
    createEventForUserMock.mockReset();
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
});
