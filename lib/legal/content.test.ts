import { afterEach, describe, expect, it, vi } from "vitest";

import { legalContactEmail, PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/lib/legal/content";

describe("legal content", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reads the contact email from NEXT_PUBLIC_CONTACT_EMAIL, ignoring blanks and junk", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", " halo@undangan.example ");
    expect(legalContactEmail()).toBe("halo@undangan.example");
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "");
    expect(legalContactEmail()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "bukan-email");
    expect(legalContactEmail()).toBeNull();
  });

  it("states the promises the product keeps (no data sale, account deletion, UU PDP)", () => {
    const privacy = JSON.stringify(PRIVACY_POLICY);
    expect(privacy).toContain("tidak menjual data pribadi");
    expect(privacy).toContain("menu Akun");
    expect(privacy).toContain("Nomor 27 Tahun 2022");
    expect(JSON.stringify(TERMS_OF_SERVICE)).toContain("hak cipta foto dan lagu");
  });
});
