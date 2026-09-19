import { describe, expect, it } from "vitest";

import {
  galleryItemSchema,
  loveStoryItemSchema,
  scheduleFormSchema,
  templateSelectionSchema,
  themeSchema,
  toScheduleInput,
  weddingProfileSchema,
} from "@/lib/editor/validation";

describe("weddingProfileSchema", () => {
  const valid = {
    brideFullName: "Ayu Lestari",
    brideNickname: "Ayu",
    brideFather: null,
    brideMother: null,
    brideInstagram: null,
    groomFullName: "Budi Santoso",
    groomNickname: "Budi",
    groomFather: null,
    groomMother: null,
    groomInstagram: null,
  };

  it("accepts valid input with nulls for unset fields", () => {
    expect(weddingProfileSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty string (client must send null, not '')", () => {
    const result = weddingProfileSchema.safeParse({ ...valid, brideNickname: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name exceeding the max length", () => {
    const result = weddingProfileSchema.safeParse({ ...valid, brideFullName: "a".repeat(121) });
    expect(result.success).toBe(false);
  });
});

describe("themeSchema", () => {
  const valid = {
    primaryColor: "#7a5c3e",
    secondaryColor: null,
    backgroundColor: null,
    textColor: null,
    accentColor: null,
    headingFont: "Georgia, serif",
    bodyFont: null,
    scriptFont: null,
    backgroundImageUrl: "https://example.com/bg.jpg",
  };

  it("accepts valid theme input", () => {
    expect(themeSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a color value with disallowed characters (CSS injection defense)", () => {
    const result = themeSchema.safeParse({ ...valid, primaryColor: "red; } body { display:none" });
    expect(result.success).toBe(false);
  });

  it("rejects a javascript: background image URL", () => {
    const result = themeSchema.safeParse({ ...valid, backgroundImageUrl: "javascript:alert(1)" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed background image URL", () => {
    const result = themeSchema.safeParse({ ...valid, backgroundImageUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("templateSelectionSchema", () => {
  it("accepts a template slug", () => {
    expect(templateSelectionSchema.safeParse({ templateSlug: "minimal-elegant" }).success).toBe(
      true,
    );
  });

  it("accepts null (revert to default)", () => {
    expect(templateSelectionSchema.safeParse({ templateSlug: null }).success).toBe(true);
  });
});

describe("scheduleFormSchema", () => {
  const valid = {
    title: "Akad Nikah",
    description: null,
    date: "2026-12-12",
    startTime: "08:00",
    endTime: "10:00",
    venueName: null,
    venueAddress: null,
    venueMapUrl: null,
    venueLatitude: null,
    venueLongitude: null,
  };

  it("accepts valid input without a venue", () => {
    expect(scheduleFormSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts valid input with a complete venue", () => {
    const result = scheduleFormSchema.safeParse({
      ...valid,
      venueName: "Gedung Serbaguna",
      venueAddress: "Jl. Uji Coba No. 1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an end time before the start time", () => {
    const result = scheduleFormSchema.safeParse({ ...valid, startTime: "10:00", endTime: "08:00" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(scheduleFormSchema.safeParse({ ...valid, date: "12/12/2026" }).success).toBe(false);
  });

  it("rejects a malformed time", () => {
    expect(scheduleFormSchema.safeParse({ ...valid, startTime: "8am" }).success).toBe(false);
  });

  it("rejects a venue name without an address (must be provided together)", () => {
    const result = scheduleFormSchema.safeParse({ ...valid, venueName: "Gedung Serbaguna" });
    expect(result.success).toBe(false);
  });

  it("rejects a javascript: venue map URL", () => {
    const result = scheduleFormSchema.safeParse({
      ...valid,
      venueName: "Gedung Serbaguna",
      venueAddress: "Jl. Uji Coba No. 1",
      venueMapUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("toScheduleInput nests the flat venue fields into a venue object", () => {
    const parsed = scheduleFormSchema.parse({
      ...valid,
      venueName: "Gedung Serbaguna",
      venueAddress: "Jl. Uji Coba No. 1",
      venueMapUrl: "https://maps.example.com",
    });

    const input = toScheduleInput(parsed);
    expect(input.venue).toEqual({
      name: "Gedung Serbaguna",
      address: "Jl. Uji Coba No. 1",
      mapUrl: "https://maps.example.com",
      latitude: null,
      longitude: null,
    });
  });

  it("toScheduleInput sets venue to null when no venue fields are present", () => {
    const parsed = scheduleFormSchema.parse(valid);
    expect(toScheduleInput(parsed).venue).toBeNull();
  });
});

describe("loveStoryItemSchema", () => {
  it("accepts valid input", () => {
    expect(
      loveStoryItemSchema.safeParse({
        dateLabel: "2018",
        title: "Pertama Bertemu",
        description: null,
        imageUrl: null,
      }).success,
    ).toBe(true);
  });

  it("rejects a missing title", () => {
    expect(
      loveStoryItemSchema.safeParse({
        dateLabel: null,
        title: "",
        description: null,
        imageUrl: null,
      }).success,
    ).toBe(false);
  });

  it("rejects a javascript: image URL", () => {
    const result = loveStoryItemSchema.safeParse({
      dateLabel: null,
      title: "Pertama Bertemu",
      description: null,
      imageUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });
});

describe("galleryItemSchema", () => {
  it("accepts a valid image item", () => {
    expect(
      galleryItemSchema.safeParse({
        type: "IMAGE",
        url: "https://example.com/a.jpg",
        caption: null,
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid type", () => {
    expect(
      galleryItemSchema.safeParse({
        type: "AUDIO",
        url: "https://example.com/a.jpg",
        caption: null,
      }).success,
    ).toBe(false);
  });

  it("rejects a javascript: URL", () => {
    expect(
      galleryItemSchema.safeParse({ type: "IMAGE", url: "javascript:alert(1)", caption: null })
        .success,
    ).toBe(false);
  });
});
