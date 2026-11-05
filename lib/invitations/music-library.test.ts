import { statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { findLibraryTrack, MUSIC_LIBRARY } from "@/lib/invitations/music-library";

describe("MUSIC_LIBRARY", () => {
  it("has unique ids", () => {
    const ids = MUSIC_LIBRARY.map((track) => track.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(MUSIC_LIBRARY.map((track) => [track.id, track] as const))(
    "%s has its file in public/music, a license and a small enough size",
    (_id, track) => {
      expect(track.url).toMatch(/^\/music\/[a-z0-9-]+\.(mp3|m4a)$/);
      expect(track.license.trim()).not.toBe("");
      expect(track.artist.trim()).not.toBe("");
      const file = statSync(path.join(process.cwd(), "public", track.url));
      expect(file.size).toBeLessThanOrEqual(6 * 1024 * 1024);
    },
  );

  it("finds a track by id and rejects unknown ids", () => {
    expect(findLibraryTrack("chopin-nocturne-op9-no2")?.url).toBe(
      "/music/chopin-nocturne-op9-no2.mp3",
    );
    expect(findLibraryTrack("tidak-ada")).toBeNull();
  });
});
