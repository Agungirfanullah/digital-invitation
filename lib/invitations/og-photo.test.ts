import { afterEach, describe, expect, it, vi } from "vitest";

import { GENERIC_OG_CARD, type OgCard } from "@/lib/invitations/og-card";
import { loadOgPhotoDataUrl, withLoadedPhoto } from "@/lib/invitations/og-photo";

function imageResponse(body: Uint8Array, type: string, extraHeaders: Record<string, string> = {}) {
  return new Response(Buffer.from(body), {
    status: 200,
    headers: { "content-type": type, ...extraHeaders },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("loadOgPhotoDataUrl", () => {
  it("inlines a small JPEG or PNG as a data URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(imageResponse(new Uint8Array([1, 2, 3]), "image/jpeg")),
    );

    await expect(loadOgPhotoDataUrl("https://x.test/a.jpg")).resolves.toBe(
      `data:image/jpeg;base64,${Buffer.from([1, 2, 3]).toString("base64")}`,
    );
  });

  it("refuses redirects, so a trusted URL cannot be bounced to another host", async () => {
    const fetchMock = vi.fn().mockResolvedValue(imageResponse(new Uint8Array([1]), "image/png"));
    vi.stubGlobal("fetch", fetchMock);

    await loadOgPhotoDataUrl("https://x.test/a.png");

    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "error" });
  });

  it("skips non-image, unsupported-format, oversized and failed responses", async () => {
    const cases: Response[] = [
      imageResponse(new Uint8Array([1]), "text/html"),
      imageResponse(new Uint8Array([1]), "image/webp"),
      imageResponse(new Uint8Array([1]), "image/jpeg", { "content-length": "5000000" }),
      imageResponse(new Uint8Array(4_000_001), "image/jpeg"),
      imageResponse(new Uint8Array(0), "image/jpeg"),
      new Response("nope", { status: 404, headers: { "content-type": "image/jpeg" } }),
    ];

    for (const response of cases) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
      await expect(loadOgPhotoDataUrl("https://x.test/a")).resolves.toBeNull();
    }
  });

  it("returns null instead of throwing when the network fails or times out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    await expect(loadOgPhotoDataUrl("https://x.test/a")).resolves.toBeNull();
  });
});

describe("withLoadedPhoto", () => {
  const cardWithPhoto: OgCard = {
    ...GENERIC_OG_CARD,
    heading: "Ayu & Budi",
    headingFontSize: 92,
    photoUrl: "https://x.test/a.jpg",
  };

  it("returns the card untouched, with no request, when there is no photo", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(withLoadedPhoto(GENERIC_OG_CARD)).resolves.toBe(GENERIC_OG_CARD);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops the photo and re-fits the heading when loading fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));

    const card = await withLoadedPhoto(cardWithPhoto);

    expect(card.photoUrl).toBeNull();
    expect(card.headingFontSize).toBe(112);
  });

  it("keeps the narrower heading size when the photo loads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(imageResponse(new Uint8Array([1, 2]), "image/png")),
    );

    const card = await withLoadedPhoto(cardWithPhoto);

    expect(card.photoUrl).toMatch(/^data:image\/png;base64,/);
    expect(card.headingFontSize).toBe(92);
  });
});
