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
