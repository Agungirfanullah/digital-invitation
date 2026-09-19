import { describe, expect, it } from "vitest";

import { buildWhatsAppShareUrl } from "@/lib/invitation-delivery/whatsapp";

describe("buildWhatsAppShareUrl", () => {
  it("builds a wa.me link with the country-code-normalized phone number", () => {
    const url = buildWhatsAppShareUrl("0812-3456-7890", "Halo!");
    expect(url).toBe("https://wa.me/6281234567890?text=Halo!");
  });

  it("URL-encodes the message text", () => {
    const url = buildWhatsAppShareUrl("081234567890", "Line one\nLine two & more");
    expect(url).toContain("text=Line%20one%0ALine%20two%20%26%20more");
  });

  it("accepts an already-international-format number", () => {
    const url = buildWhatsAppShareUrl("+62 812 3456 7890", "Halo!");
    expect(url).toBe("https://wa.me/6281234567890?text=Halo!");
  });

  it("returns null for a too-short/missing phone number", () => {
    expect(buildWhatsAppShareUrl("123", "Halo!")).toBeNull();
    expect(buildWhatsAppShareUrl("", "Halo!")).toBeNull();
  });
});
