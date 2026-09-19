import { describe, expect, it } from "vitest";

import { composeInvitationMessage } from "@/lib/invitation-delivery/message";

describe("composeInvitationMessage", () => {
  it("personalizes the guest name, event title, and URL into the PRD copy", () => {
    const result = composeInvitationMessage({
      guestName: "Ayu Lestari",
      eventTitle: "Pernikahan Raka & Nadia",
      invitationUrl: "https://undangan.example.com/invite/raka-dan-nadia?to=abc123",
    });

    expect(result.text).toContain("Halo Ayu Lestari,");
    expect(result.text).toContain("Pernikahan Raka & Nadia");
    expect(result.text).toContain("https://undangan.example.com/invite/raka-dan-nadia?to=abc123");
    expect(result.text).toContain("Terima kasih atas doa dan kehadirannya.");
    expect(result.url).toBe("https://undangan.example.com/invite/raka-dan-nadia?to=abc123");
  });

  it("does not include any field it wasn't given", () => {
    const result = composeInvitationMessage({
      guestName: "Budi",
      eventTitle: "Ulang Tahun Budi",
      invitationUrl: "https://example.com/invite/x?to=y",
    });

    expect(result.text).not.toContain("undefined");
    expect(result.text).not.toContain("null");
  });
});
