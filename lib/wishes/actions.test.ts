import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const checkWishRateLimitMock = vi.fn();
const submitWishForGuestMock = vi.fn();
const approveWishForUserMock = vi.fn();
const hideWishForUserMock = vi.fn();
const deleteWishForUserMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args),
}));

vi.mock("@/lib/wishes/rate-limit", () => ({
  checkWishRateLimit: (...args: unknown[]) => checkWishRateLimitMock(...args),
}));

vi.mock("@/lib/wishes/service", () => ({
  submitWishForGuest: (...args: unknown[]) => submitWishForGuestMock(...args),
  approveWishForUser: (...args: unknown[]) => approveWishForUserMock(...args),
  hideWishForUser: (...args: unknown[]) => hideWishForUserMock(...args),
  deleteWishForUser: (...args: unknown[]) => deleteWishForUserMock(...args),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  approveWishAction,
  deleteWishAction,
  hideWishAction,
  submitWishAction,
} from "@/lib/wishes/actions";

beforeEach(() => {
  requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
  checkWishRateLimitMock.mockReset().mockResolvedValue(true);
  submitWishForGuestMock.mockReset();
  approveWishForUserMock.mockReset();
  hideWishForUserMock.mockReset();
  deleteWishForUserMock.mockReset();
});

function wishFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("name", "Ayu");
  formData.set("message", "Selamat menempuh hidup baru!");
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
  return formData;
}

describe("submitWishAction — rate limiting", () => {
  it("returns an error without calling the service layer when rate-limited", async () => {
    checkWishRateLimitMock.mockResolvedValue(false);

    const result = await submitWishAction("event-1", "token-1", { status: "idle" }, wishFormData());

    expect(result.status).toBe("error");
    expect(submitWishForGuestMock).not.toHaveBeenCalled();
  });
});

describe("submitWishAction — server-side validation", () => {
  it("rejects an empty name without calling the service layer", async () => {
    const result = await submitWishAction(
      "event-1",
      "token-1",
      { status: "idle" },
      wishFormData({ name: "" }),
    );

    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.fieldErrors?.name).toBeDefined();
    expect(submitWishForGuestMock).not.toHaveBeenCalled();
  });

  it("rejects an empty message without calling the service layer", async () => {
    const result = await submitWishAction(
      "event-1",
      "token-1",
      { status: "idle" },
      wishFormData({ message: "" }),
    );

    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.fieldErrors?.message).toBeDefined();
    expect(submitWishForGuestMock).not.toHaveBeenCalled();
  });

  it("passes only eventId, token, and the parsed answer to the service layer — never a guestId", async () => {
    submitWishForGuestMock.mockResolvedValue(undefined);

    const formData = wishFormData();
    formData.set("guestId", "someone-elses-guest-id");

    const result = await submitWishAction("event-1", "token-1", { status: "idle" }, formData);

    expect(result.status).toBe("success");
    expect(submitWishForGuestMock).toHaveBeenCalledWith(
      "event-1",
      "token-1",
      expect.not.objectContaining({ guestId: expect.anything() }),
    );
  });

  it("maps a thrown domain error to a safe message", async () => {
    submitWishForGuestMock.mockRejectedValue(new Error("some internal detail"));

    const result = await submitWishAction("event-1", "token-1", { status: "idle" }, wishFormData());

    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.error).not.toMatch(/internal detail/);
  });
});

describe("moderation actions — authorization short-circuit", () => {
  it("approveWishAction calls notFound() when the wish belongs to a different event", async () => {
    const { WishNotFoundError } = await import("@/lib/wishes/errors");
    approveWishForUserMock.mockRejectedValue(new WishNotFoundError());

    await expect(approveWishAction("event-1", "wish-1", {}, new FormData())).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("hideWishAction calls notFound() when the event is not found/authorized", async () => {
    const { EventNotFoundError } = await import("@/lib/wishes/errors");
    hideWishForUserMock.mockRejectedValue(new EventNotFoundError());

    await expect(hideWishAction("event-1", "wish-1", {}, new FormData())).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("deleteWishAction derives the current user from the session, never from form input", async () => {
    deleteWishForUserMock.mockResolvedValue(undefined);
    const formData = new FormData();
    formData.set("userId", "someone-elses-user-id");

    const result = await deleteWishAction("event-1", "wish-1", {}, formData);

    expect(result).toEqual({});
    expect(deleteWishForUserMock).toHaveBeenCalledWith("event-1", "user-1", "wish-1");
  });
});
