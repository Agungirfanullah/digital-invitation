import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const createGiftMethodForUserMock = vi.fn();
const updateGiftMethodForUserMock = vi.fn();
const deleteGiftMethodForUserMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args),
}));

vi.mock("@/lib/gifts/service", () => ({
  createGiftMethodForUser: (...args: unknown[]) => createGiftMethodForUserMock(...args),
  updateGiftMethodForUser: (...args: unknown[]) => updateGiftMethodForUserMock(...args),
  deleteGiftMethodForUser: (...args: unknown[]) => deleteGiftMethodForUserMock(...args),
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

import {
  createGiftMethodAction,
  deleteGiftMethodAction,
  updateGiftMethodAction,
} from "@/lib/gifts/actions";

beforeEach(() => {
  requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
  createGiftMethodForUserMock.mockReset();
  updateGiftMethodForUserMock.mockReset();
  deleteGiftMethodForUserMock.mockReset();
});

function giftMethodFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("type", "BANK");
  formData.set("providerName", "Bank Contoh");
  formData.set("accountName", "Budi Santoso");
  formData.set("accountNumber", "1234567890");
  formData.set("qrImageUrl", "");
  formData.set("instructions", "");
  formData.set("isActive", "on");
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
  return formData;
}

describe("createGiftMethodAction — server-side validation", () => {
  it("rejects a BANK method missing the account number without calling the service layer", async () => {
    const result = await createGiftMethodAction(
      "event-1",
      {},
      giftMethodFormData({ accountNumber: "" }),
    );

    expect(result.fieldErrors?.accountNumber).toBeDefined();
    expect(createGiftMethodForUserMock).not.toHaveBeenCalled();
  });

  it("rejects a QR method with an unsafe image URL without calling the service layer", async () => {
    const result = await createGiftMethodAction(
      "event-1",
      {},
      giftMethodFormData({ type: "QR", qrImageUrl: "javascript:alert(1)" }),
    );

    expect(result.fieldErrors?.qrImageUrl).toBeDefined();
    expect(createGiftMethodForUserMock).not.toHaveBeenCalled();
  });

  it("derives the current user from the session, never from form input", async () => {
    createGiftMethodForUserMock.mockResolvedValue({ id: "gift-1" });
    const formData = giftMethodFormData();
    // A malicious/buggy client including a userId field must be ignored.
    formData.set("userId", "someone-elses-user-id");

    await expect(createGiftMethodAction("event-1", {}, formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(createGiftMethodForUserMock).toHaveBeenCalledWith(
      "event-1",
      "user-1",
      expect.not.objectContaining({ userId: expect.anything() }),
    );
  });

  it("calls notFound() when the service reports the event as not found/authorized", async () => {
    const { EventNotFoundError } = await import("@/lib/gifts/errors");
    createGiftMethodForUserMock.mockRejectedValue(new EventNotFoundError());

    await expect(createGiftMethodAction("event-1", {}, giftMethodFormData())).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});

describe("updateGiftMethodAction — server-side validation", () => {
  it("rejects an OTHER method missing instructions without calling the service layer", async () => {
    const result = await updateGiftMethodAction(
      "event-1",
      "gift-1",
      {},
      giftMethodFormData({ type: "OTHER", accountNumber: "", instructions: "" }),
    );

    expect(result.fieldErrors?.instructions).toBeDefined();
    expect(updateGiftMethodForUserMock).not.toHaveBeenCalled();
  });
});

describe("deleteGiftMethodAction", () => {
  it("calls notFound() when the gift method belongs to a different event", async () => {
    const { GiftMethodNotFoundError } = await import("@/lib/gifts/errors");
    deleteGiftMethodForUserMock.mockRejectedValue(new GiftMethodNotFoundError());

    await expect(deleteGiftMethodAction("event-1", "gift-1", {}, new FormData())).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
