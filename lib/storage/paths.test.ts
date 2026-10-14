import { describe, expect, it } from "vitest";

import { getClientEnv, getServerEnv } from "@/lib/env";
import {
  buildGalleryObjectPath,
  buildIdentityPhotoObjectPath,
  derivePathForEvent,
  derivePathFromPublicUrl,
} from "@/lib/storage/paths";

describe("buildGalleryObjectPath", () => {
  it("embeds the eventId and extension in a predictable, event-scoped shape", () => {
    const path = buildGalleryObjectPath("event-abc123", "png");
    expect(path).toMatch(/^events\/event-abc123\/gallery\/[0-9a-f]{32}\.png$/);
  });

  it("never collides across two calls for the same event (random filename component)", () => {
    const first = buildGalleryObjectPath("event-abc123", "png");
    const second = buildGalleryObjectPath("event-abc123", "png");
    expect(first).not.toBe(second);
  });

  it("scopes different events to different path prefixes — no cross-event collision possible", () => {
    const pathA = buildGalleryObjectPath("event-aaa", "jpg");
    const pathB = buildGalleryObjectPath("event-bbb", "jpg");
    expect(pathA.startsWith("events/event-aaa/")).toBe(true);
    expect(pathB.startsWith("events/event-bbb/")).toBe(true);
  });

  it("rejects an eventId containing path-traversal-shaped characters", () => {
    expect(() => buildGalleryObjectPath("../../etc/passwd", "png")).toThrow();
  });

  it("rejects an eventId containing a path separator", () => {
    expect(() => buildGalleryObjectPath("event/other", "png")).toThrow();
  });

  it("rejects an unsafe extension", () => {
    expect(() => buildGalleryObjectPath("event-abc123", "png/../evil")).toThrow();
  });
});

describe("derivePathFromPublicUrl", () => {
  const bucket = getServerEnv().SUPABASE_STORAGE_BUCKET;
  const supabaseUrl = getClientEnv().NEXT_PUBLIC_SUPABASE_URL;

  it("recovers the object path from a genuine own-bucket public URL", () => {
    const path = "events/event-abc123/gallery/deadbeefdeadbeefdeadbeefdeadbeef.png";
    const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    expect(derivePathFromPublicUrl(url)).toBe(path);
  });

  it("returns null for a URL from an entirely different host (a legacy externally-pasted URL)", () => {
    expect(derivePathFromPublicUrl("https://example.com/photo.jpg")).toBeNull();
  });

  it("returns null for a URL from a different Supabase project", () => {
    const path = "events/event-abc123/gallery/x.png";
    const url = `https://some-other-project.supabase.co/storage/v1/object/public/${bucket}/${path}`;
    expect(derivePathFromPublicUrl(url)).toBeNull();
  });

  it("returns null for a URL pointing at a different bucket name", () => {
    const url = `${supabaseUrl}/storage/v1/object/public/some-other-bucket/events/e/gallery/x.png`;
    expect(derivePathFromPublicUrl(url)).toBeNull();
  });

  it("returns null (never a traversal-shaped path) for a URL whose suffix contains '..'", () => {
    const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/../../etc/passwd`;
    expect(derivePathFromPublicUrl(url)).toBeNull();
  });

  it("returns null for the prefix with nothing after it", () => {
    const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/`;
    expect(derivePathFromPublicUrl(url)).toBeNull();
  });
});

describe("buildIdentityPhotoObjectPath", () => {
  it("is event-scoped under identity/ and never repeats", () => {
    const first = buildIdentityPhotoObjectPath("event-abc123", "jpg");
    expect(first).toMatch(/^events\/event-abc123\/identity\/[0-9a-f]{32}\.jpg$/);
    expect(buildIdentityPhotoObjectPath("event-abc123", "jpg")).not.toBe(first);
  });

  it("rejects an unsafe eventId", () => {
    expect(() => buildIdentityPhotoObjectPath("../x", "jpg")).toThrow();
  });
});

describe("derivePathForEvent", () => {
  const bucket = getServerEnv().SUPABASE_STORAGE_BUCKET;
  const supabaseUrl = getClientEnv().NEXT_PUBLIC_SUPABASE_URL;
  const urlFor = (path: string) => `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

  it("returns the path for the event's own file", () => {
    const path = "events/event-aaa/identity/x.jpg";
    expect(derivePathForEvent(urlFor(path), "event-aaa")).toBe(path);
  });

  it("refuses another event's file, so one event cannot point a delete at a neighbor's photo", () => {
    expect(derivePathForEvent(urlFor("events/event-bbb/identity/x.jpg"), "event-aaa")).toBeNull();
  });

  it("does not mistake a longer event id for the same event (prefix attack)", () => {
    expect(derivePathForEvent(urlFor("events/event-aaa2/identity/x.jpg"), "event-aaa")).toBeNull();
  });

  it("refuses an external URL and an unsafe event id", () => {
    expect(derivePathForEvent("https://example.com/x.jpg", "event-aaa")).toBeNull();
    expect(() => derivePathForEvent(urlFor("events/a/x.jpg"), "../a")).toThrow();
  });
});
