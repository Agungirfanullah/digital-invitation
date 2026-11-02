import { describe, expect, it } from "vitest";

import {
  buildDemoInvitation,
  buildDemoInvitationWithPhotos,
} from "@/lib/marketing/demo-invitation";
import { templateStyle } from "@/lib/marketing/template-styles";

describe("buildDemoInvitationWithPhotos", () => {
  it("adds a cover, member portraits and a gallery on top of the plain demo", () => {
    const plain = buildDemoInvitation("dark-luxury");
    const withPhotos = buildDemoInvitationWithPhotos("dark-luxury");

    expect(plain.theme.backgroundImageUrl).toBeFalsy();
    expect(withPhotos.theme.backgroundImageUrl).toMatch(/^https:\/\/picsum\.photos\/id\//);
    expect(withPhotos.identity?.members.every((member) => member.photoUrl)).toBe(true);
    expect(withPhotos.galleries[0].items).toHaveLength(4);
    expect(withPhotos.templateKey).toBe("dark-luxury");
  });

  it("matches the photo mood to the template", () => {
    const elegant = buildDemoInvitationWithPhotos("dark-luxury").theme.backgroundImageUrl;
    const warm = buildDemoInvitationWithPhotos("floral-romance").theme.backgroundImageUrl;
    expect(elegant).not.toEqual(warm);
  });

  it("fills every section a template can show, with obviously sample data", () => {
    const demo = buildDemoInvitationWithPhotos("royal-gold");

    expect(demo.identity?.members.map((member) => member.name)).toEqual([
      "Ayu Lestari Putri",
      "Budi Santoso",
    ]);
    expect(demo.loveStory?.items.length).toBeGreaterThanOrEqual(3);
    // A made-up bank, so nobody can send money to the sample account.
    expect(demo.giftMethods.find((method) => method.type === "BANK")?.providerName).toBe(
      "Bank Contoh",
    );
    // Invented guest wishes would be fabricated social proof.
    expect(demo.wishes).toEqual([]);
  });

  it("never carries a guest, so previews never look personalized", () => {
    expect(buildDemoInvitationWithPhotos("royal-gold").guest).toBeNull();
  });
});

describe("templateStyle", () => {
  it("groups a known template and leaves an unknown one ungrouped", () => {
    expect(templateStyle("playful-pop")).toBe("Ceria");
    expect(templateStyle("not-a-template")).toBeNull();
  });
});
