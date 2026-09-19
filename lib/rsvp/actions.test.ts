import { beforeEach, describe, expect, it, vi } from "vitest";

const checkRsvpRateLimitMock = vi.fn();
const submitRsvpForGuestMock = vi.fn();

vi.mock("@/lib/rsvp/rate-limit", () => ({
  checkRsvpRateLimit: (...args: unknown[]) => checkRsvpRateLimitMock(...args),
}));

vi.mock("@/lib/rsvp/service", () => ({
  submitRsvpForGuest: (...args: unknown[]) => submitRsvpForGuestMock(...args),
}));

import { submitRsvpAction } from "@/lib/rsvp/actions";

beforeEach(() => {
  checkRsvpRateLimitMock.mockReset().mockResolvedValue(true);
  submitRsvpForGuestMock.mockReset();
});

function rsvpFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("attendance", "ATTENDING");
  formData.set("attendeeCount", "2");
  formData.set("message", "");
  for (const [key, value] of Object.entries(overrides)) formData.set(key, value);
  return formData;
}

describe("submitRsvpAction — rate limiting", () => {
  it("returns an error without calling the service layer when rate-limited", async () => {
    checkRsvpRateLimitMock.mockResolvedValue(false);

    const result = await submitRsvpAction("event-1", "token-1", { status: "idle" }, rsvpFormData());

    expect(result.status).toBe("error");
    expect(submitRsvpForGuestMock).not.toHaveBeenCalled();
  });
});

describe("submitRsvpAction — server-side validation", () => {
  it("rejects an ATTENDING answer with 0 attendees without calling the service layer", async () => {
    const result = await submitRsvpAction(
      "event-1",
      "token-1",
      { status: "idle" },
      rsvpFormData({ attendeeCount: "0" }),
    );

    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.fieldErrors?.attendeeCount).toBeDefined();
    expect(submitRsvpForGuestMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown attendance value without calling the service layer", async () => {
    const result = await submitRsvpAction(
      "event-1",
      "token-1",
      { status: "idle" },
      rsvpFormData({ attendance: "UNSURE" }),
    );

    expect(result.status).toBe("error");
    expect(submitRsvpForGuestMock).not.toHaveBeenCalled();
  });

  it("passes only eventId, token, and the parsed answer to the service layer — never a guestId", async () => {
    submitRsvpForGuestMock.mockResolvedValue({
      attendance: "ATTENDING",
      attendeeCount: 2,
      message: null,
    });

    const formData = rsvpFormData();
    formData.set("guestId", "someone-elses-guest-id");

    const result = await submitRsvpAction("event-1", "token-1", { status: "idle" }, formData);

    expect(result.status).toBe("success");
    expect(submitRsvpForGuestMock).toHaveBeenCalledWith(
      "event-1",
      "token-1",
      expect.not.objectContaining({ guestId: expect.anything() }),
    );
  });

  it("maps a thrown domain error to a safe message", async () => {
    submitRsvpForGuestMock.mockRejectedValue(new Error("some internal detail"));

    const result = await submitRsvpAction("event-1", "token-1", { status: "idle" }, rsvpFormData());

    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.error).not.toMatch(/internal detail/);
  });
});
