import { describe, expect, it } from "vitest";

import { mergeMusic, resolveMusic } from "@/lib/invitations/music";

describe("background music setting", () => {
  const music = {
    url: "https://storage.example/events/e/music/a.mp3",
    title: "Lagu",
    source: "upload",
  };

  it("reads a valid setting and ignores anything malformed", () => {
    expect(resolveMusic({ music })).toEqual(music);
    expect(resolveMusic(null)).toBeNull();
    expect(resolveMusic({ music: { url: "", title: null, source: "upload" } })).toBeNull();
    expect(resolveMusic({ music: { url: "x", title: null, source: "radio" } })).toBeNull();
    expect(resolveMusic([music])).toBeNull();
  });

  it("sets and removes music without touching other settings", () => {
    const settings = { openingEnabled: false, sections: { gift: false } };
    const withMusic = mergeMusic(settings, music as never);
    expect(withMusic).toEqual({ ...settings, music });
    expect(mergeMusic(withMusic, null)).toEqual(settings);
    expect(settings).toEqual({ openingEnabled: false, sections: { gift: false } });
  });
});
