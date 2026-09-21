import { describe, expect, it } from "vitest";

import { buildGuestQrFileName } from "@/lib/guests/qr-filename";

describe("buildGuestQrFileName", () => {
  it("builds a slugified, .svg-suffixed filename from the guest name", () => {
    expect(buildGuestQrFileName("Ayu Lestari")).toBe("qr-undangan-ayu-lestari.svg");
  });

  it("strips diacritics and punctuation, matching slugify()'s existing behavior", () => {
    expect(buildGuestQrFileName("José García-Núñez")).toBe("qr-undangan-jose-garcia-nunez.svg");
  });

  it("falls back to a generic name when the guest name has no valid characters", () => {
    expect(buildGuestQrFileName("!!!")).toBe("qr-undangan-tamu.svg");
  });

  it("always ends in .svg and always starts with the fixed qr-undangan- prefix", () => {
    const result = buildGuestQrFileName("Budi Santoso");
    expect(result.startsWith("qr-undangan-")).toBe(true);
    expect(result.endsWith(".svg")).toBe(true);
  });
});
