import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAppUserMock = vi.fn();
const updateWeddingProfileMock = vi.fn();
const updateThemeMock = vi.fn();
const selectTemplateMock = vi.fn();
const createScheduleMock = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireAppUser: (...args: unknown[]) => requireAppUserMock(...args),
}));

vi.mock("@/lib/editor/service", () => ({
  updateWeddingProfile: (...args: unknown[]) => updateWeddingProfileMock(...args),
  updateTheme: (...args: unknown[]) => updateThemeMock(...args),
  selectTemplate: (...args: unknown[]) => selectTemplateMock(...args),
  createSchedule: (...args: unknown[]) => createScheduleMock(...args),
}));

import {
  createScheduleAction,
  saveThemeAction,
  saveWeddingProfileAction,
  selectTemplateAction,
} from "@/lib/editor/actions";

describe("editor actions — server-side validation and authorization", () => {
  beforeEach(() => {
    requireAppUserMock.mockReset().mockResolvedValue({ id: "user-1" });
    updateWeddingProfileMock.mockReset();
    updateThemeMock.mockReset();
    selectTemplateMock.mockReset();
    createScheduleMock.mockReset();
  });

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
});
