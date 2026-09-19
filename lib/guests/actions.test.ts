import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const createGuestForUserMock = vi.fn();
const updateGuestForUserMock = vi.fn();
const deleteGuestForUserMock = vi.fn();
const previewGuestImportMock = vi.fn();
const confirmGuestImportMock = vi.fn();
const regenerateGuestInvitationTokenMock = vi.fn();
const checkGuestInvitationRateLimitMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args),
}));

vi.mock("@/lib/guests/service", () => ({
  createGuestForUser: (...args: unknown[]) => createGuestForUserMock(...args),
  updateGuestForUser: (...args: unknown[]) => updateGuestForUserMock(...args),
  deleteGuestForUser: (...args: unknown[]) => deleteGuestForUserMock(...args),
  previewGuestImport: (...args: unknown[]) => previewGuestImportMock(...args),
  confirmGuestImport: (...args: unknown[]) => confirmGuestImportMock(...args),
  regenerateGuestInvitationToken: (...args: unknown[]) =>
    regenerateGuestInvitationTokenMock(...args),
}));

vi.mock("@/lib/guests/rate-limit", () => ({
  checkGuestInvitationRateLimit: (...args: unknown[]) => checkGuestInvitationRateLimitMock(...args),
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
  confirmGuestImportAction,
  createGuestAction,
  previewGuestImportAction,
  regenerateInvitationTokenAction,
  updateGuestAction,
} from "@/lib/guests/actions";

beforeEach(() => {
  requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
  createGuestForUserMock.mockReset();
  updateGuestForUserMock.mockReset();
  deleteGuestForUserMock.mockReset();
  previewGuestImportMock.mockReset();
  confirmGuestImportMock.mockReset();
  regenerateGuestInvitationTokenMock.mockReset();
  checkGuestInvitationRateLimitMock.mockReset().mockResolvedValue(true);
});

function guestFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("name", "Budi Santoso");
  formData.set("phone", "0812-3456-7890");
  formData.set("email", "budi@example.com");
  formData.set("category", "FAMILY");
  formData.set("seatQuota", "2");
  formData.set("notes", "");
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
  return formData;
}

describe("createGuestAction — server-side validation", () => {
  it("rejects a too-short name without calling the service layer", async () => {
    const result = await createGuestAction("event-1", {}, guestFormData({ name: "A" }));

    expect(result.fieldErrors?.name).toBeDefined();
    expect(createGuestForUserMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid email without calling the service layer", async () => {
    const result = await createGuestAction("event-1", {}, guestFormData({ email: "not-an-email" }));

    expect(result.fieldErrors?.email).toBeDefined();
    expect(createGuestForUserMock).not.toHaveBeenCalled();
  });

  it("derives the current user from the session, never from form input", async () => {
    createGuestForUserMock.mockResolvedValue({ id: "guest-1" });
    const formData = guestFormData();
    // A malicious/buggy client including a userId field must be ignored.
    formData.set("userId", "someone-elses-user-id");

    await expect(createGuestAction("event-1", {}, formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(createGuestForUserMock).toHaveBeenCalledWith(
      "event-1",
      "user-1",
      expect.not.objectContaining({ userId: expect.anything() }),
    );
  });
});

describe("updateGuestAction — server-side validation", () => {
  it("rejects invalid input without calling the service layer", async () => {
    const result = await updateGuestAction(
      "event-1",
      "guest-1",
      {},
      guestFormData({ seatQuota: "0" }),
    );

    expect(result.fieldErrors?.seatQuota).toBeDefined();
    expect(updateGuestForUserMock).not.toHaveBeenCalled();
  });
});

describe("previewGuestImportAction", () => {
  it("returns an error without calling the service layer when the CSV text is blank", async () => {
    const formData = new FormData();
    formData.set("csvText", "   ");

    const result = await previewGuestImportAction("event-1", {}, formData);

    expect(result.error).toBeDefined();
    expect(previewGuestImportMock).not.toHaveBeenCalled();
  });

  it("passes the authenticated user's id (never a client-supplied one) to the service layer", async () => {
    previewGuestImportMock.mockResolvedValue({
      rows: [],
      importableCount: 0,
      duplicateCount: 0,
      invalidCount: 0,
    });
    const formData = new FormData();
    formData.set("csvText", "nama\nBudi");
    formData.set("userId", "someone-elses-user-id");

    await previewGuestImportAction("event-1", {}, formData);

    expect(previewGuestImportMock).toHaveBeenCalledWith("event-1", "user-1", "nama\nBudi");
  });
});

describe("confirmGuestImportAction", () => {
  it("returns an error without calling the service layer when the CSV text is missing", async () => {
    const result = await confirmGuestImportAction("event-1", {}, new FormData());

    expect(result.error).toBeDefined();
    expect(confirmGuestImportMock).not.toHaveBeenCalled();
  });
});

describe("regenerateInvitationTokenAction", () => {
  it("returns an error without calling the service layer when rate-limited", async () => {
    checkGuestInvitationRateLimitMock.mockResolvedValue(false);

    const result = await regenerateInvitationTokenAction(
      "event-1",
      "guest-1",
      { status: "idle" },
      new FormData(),
    );

    expect(result.status).toBe("error");
    expect(regenerateGuestInvitationTokenMock).not.toHaveBeenCalled();
  });

  it("derives the current user from the session and passes eventId/guestId through, never a client-supplied field", async () => {
    regenerateGuestInvitationTokenMock.mockResolvedValue({
      invitationToken: "new-token",
      invitationStatus: "NOT_SENT",
    });

    const result = await regenerateInvitationTokenAction(
      "event-1",
      "guest-1",
      { status: "idle" },
      new FormData(),
    );

    expect(result.status).toBe("success");
    expect(regenerateGuestInvitationTokenMock).toHaveBeenCalledWith("event-1", "user-1", "guest-1");
  });

  it("maps a thrown domain error to a safe message", async () => {
    regenerateGuestInvitationTokenMock.mockRejectedValue(new Error("some internal detail"));

    const result = await regenerateInvitationTokenAction(
      "event-1",
      "guest-1",
      { status: "idle" },
      new FormData(),
    );

    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.error).not.toMatch(/internal detail/);
  });
});
