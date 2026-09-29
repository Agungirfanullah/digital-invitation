import { describe, expect, it } from "vitest";
import { EventType } from "@prisma/client";

import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";
import {
  buildPublicIdentity,
  emptyIdentityFor,
  getHeroHeading,
  getMissingPublishRequirements,
} from "@/lib/event-types/identity";
import { getIdentityFieldGroups } from "@/lib/event-types/identity-fields";
import { IDENTITY_BY_TYPE } from "@/components/invitation/templates/test-fixtures";

const ALL_TYPES = Object.values(EventType);

describe("EVENT_TYPE_CONFIG", () => {
  it("maps every EventType to the approved identity family", () => {
    expect(
      Object.fromEntries(ALL_TYPES.map((type) => [type, EVENT_TYPE_CONFIG[type].family])),
    ).toEqual({
      WEDDING: "COUPLE",
      ENGAGEMENT: "COUPLE",
      ANNIVERSARY: "COUPLE",
      BIRTHDAY: "PERSON",
      AQIQAH: "BABY_FAMILY",
      GATHERING: "HOST_GROUP",
      CORPORATE: "ORGANIZATION",
      OTHER: "GENERIC",
    });
  });

  it("uses wedding terminology only for the couple types that are genuinely weddings/engagements", () => {
    for (const type of ALL_TYPES) {
      const config = EVENT_TYPE_CONFIG[type];
      const copy = [config.identityHeading, config.closingMessage, config.storyNavLabel].join(" ");
      if (type === "WEDDING" || type === "ENGAGEMENT") continue;
      expect(copy).not.toMatch(/Mempelai|doa restu|Kisah Cinta/);
    }
  });
});

describe("buildPublicIdentity", () => {
  it("Wedding regression: nickname pair, role labels, instagram — and no parents", () => {
    expect(buildPublicIdentity("WEDDING", IDENTITY_BY_TYPE.WEDDING)).toEqual({
      family: "COUPLE",
      heading: "Mempelai",
      displayName: "Ayu & Budi",
      members: [
        { role: "Mempelai Wanita", name: "Ayu Lestari", instagram: "ayulestari" },
        { role: "Mempelai Pria", name: "Budi Santoso", instagram: "budisantoso" },
      ],
      pairMembers: true,
      details: [],
    });
  });

  it("gives each type its own identity presentation", () => {
    expect(buildPublicIdentity("ENGAGEMENT", IDENTITY_BY_TYPE.ENGAGEMENT)?.members[0].role).toBe(
      "Calon Mempelai Wanita",
    );
    expect(buildPublicIdentity("ANNIVERSARY", IDENTITY_BY_TYPE.ANNIVERSARY)).toMatchObject({
      heading: "Pasangan",
      details: ["Merayakan 25 tahun bersama"],
    });
    expect(buildPublicIdentity("BIRTHDAY", IDENTITY_BY_TYPE.BIRTHDAY)).toMatchObject({
      heading: "Yang Berulang Tahun",
      displayName: "Citra",
      pairMembers: false,
      details: ["Ulang tahun ke-17", "Sweet Seventeen", "Diselenggarakan oleh Keluarga Bapak Andi"],
    });
    expect(buildPublicIdentity("AQIQAH", IDENTITY_BY_TYPE.AQIQAH)).toMatchObject({
      displayName: "Rafa",
      details: [
        "Buah hati dari Rizky Pratama & Nadia Putri",
        "Lahir pada 17 Agustus 2026",
        "Anak pertama",
      ],
    });
    expect(buildPublicIdentity("GATHERING", IDENTITY_BY_TYPE.GATHERING)).toMatchObject({
      heading: "Tuan Rumah",
      displayName: null,
      members: [{ role: null, name: "Keluarga Besar Wiryo", instagram: null }],
    });
    expect(buildPublicIdentity("CORPORATE", IDENTITY_BY_TYPE.CORPORATE)).toMatchObject({
      heading: "Penyelenggara",
      displayName: null,
      details: ["Narahubung: Dewi (HR)", "Dress code: Batik"],
    });
    expect(buildPublicIdentity("OTHER", IDENTITY_BY_TYPE.OTHER)).toBeNull();
  });

  it("hides anniversary years for a Wedding even if a value is stored", () => {
    const identity = buildPublicIdentity("WEDDING", IDENTITY_BY_TYPE.ANNIVERSARY);
    expect(identity?.details).toEqual([]);
  });

  it("returns null for an empty profile — no fake identity", () => {
    for (const type of ALL_TYPES) {
      expect(buildPublicIdentity(type, emptyIdentityFor(type))).toBeNull();
    }
  });

  it("returns null when the identity's family doesn't match the type", () => {
    expect(buildPublicIdentity("CORPORATE", IDENTITY_BY_TYPE.WEDDING)).toBeNull();
    expect(buildPublicIdentity("WEDDING", IDENTITY_BY_TYPE.BIRTHDAY)).toBeNull();
  });
});

describe("getHeroHeading", () => {
  it("uses the identity's display name, else the event title", () => {
    const identity = buildPublicIdentity("WEDDING", IDENTITY_BY_TYPE.WEDDING);
    expect(getHeroHeading({ title: "Judul", identity })).toBe("Ayu & Budi");
    expect(getHeroHeading({ title: "Rapat Tahunan", identity: null })).toBe("Rapat Tahunan");
    const corporate = buildPublicIdentity("CORPORATE", IDENTITY_BY_TYPE.CORPORATE);
    expect(getHeroHeading({ title: "Rapat Tahunan", identity: corporate })).toBe("Rapat Tahunan");
  });
});

describe("getMissingPublishRequirements", () => {
  it("is satisfied by every type's complete identity plus one schedule", () => {
    for (const type of ALL_TYPES) {
      expect(getMissingPublishRequirements(type, IDENTITY_BY_TYPE[type], 1)).toEqual([]);
    }
  });

  it("lists each type's required identity information when empty", () => {
    const missing = (type: EventType) =>
      getMissingPublishRequirements(type, emptyIdentityFor(type), 1);
    expect(missing("WEDDING")).toEqual(["Nama Mempelai Wanita", "Nama Mempelai Pria"]);
    expect(missing("ENGAGEMENT")).toEqual([
      "Nama Calon Mempelai Wanita",
      "Nama Calon Mempelai Pria",
    ]);
    expect(missing("ANNIVERSARY")).toEqual(["Nama Istri", "Nama Suami"]);
    expect(missing("BIRTHDAY")).toEqual(["Nama yang berulang tahun"]);
    expect(missing("AQIQAH")).toEqual(["Nama buah hati", "Nama orang tua"]);
    expect(missing("GATHERING")).toEqual(["Nama tuan rumah"]);
    expect(missing("CORPORATE")).toEqual(["Nama organisasi"]);
    expect(missing("OTHER")).toEqual([]);
  });

  it("requires a date (a schedule) for every type except Wedding (unchanged baseline)", () => {
    for (const type of ALL_TYPES) {
      const missing = getMissingPublishRequirements(type, IDENTITY_BY_TYPE[type], 0);
      expect(missing.includes("Tanggal acara (tambahkan minimal satu jadwal)")).toBe(
        type !== "WEDDING",
      );
    }
  });

  it("accepts a nickname in place of a full name, and one parent for Aqiqah", () => {
    expect(
      getMissingPublishRequirements(
        "BIRTHDAY",
        { family: "PERSON", data: { ...emptyPerson(), nickname: "Citra" } },
        1,
      ),
    ).toEqual([]);
    expect(
      getMissingPublishRequirements(
        "AQIQAH",
        {
          family: "BABY_FAMILY",
          data: {
            babyFullName: "Rafa",
            babyNickname: null,
            fatherName: null,
            motherName: "Nadia",
            birthDate: null,
            birthDetails: null,
          },
        },
        1,
      ),
    ).toEqual([]);
  });

  it("treats another family's identity as missing", () => {
    expect(getMissingPublishRequirements("CORPORATE", IDENTITY_BY_TYPE.WEDDING, 1)).toEqual([
      "Nama organisasi",
    ]);
  });
});

describe("getIdentityFieldGroups", () => {
  it("offers bride/groom fields only to couple types, and no form at all for OTHER", () => {
    for (const type of ALL_TYPES) {
      const keys = getIdentityFieldGroups(type).flatMap((group) => group.fields.map((f) => f.key));
      const hasCoupleFields = keys.some(
        (key) => key.startsWith("bride") || key.startsWith("groom"),
      );
      expect(hasCoupleFields).toBe(EVENT_TYPE_CONFIG[type].family === "COUPLE");
      if (type === "OTHER") expect(keys).toEqual([]);
    }
  });

  it("only Anniversary gets the years-together field", () => {
    for (const type of ALL_TYPES) {
      const keys = getIdentityFieldGroups(type).flatMap((group) => group.fields.map((f) => f.key));
      expect(keys.includes("yearsTogether")).toBe(type === "ANNIVERSARY");
    }
  });

  it("every field key exists on the type's canonical identity data", () => {
    for (const type of ALL_TYPES) {
      const empty = emptyIdentityFor(type);
      if (empty.family === "GENERIC") continue;
      for (const group of getIdentityFieldGroups(type)) {
        for (const field of group.fields) expect(Object.keys(empty.data)).toContain(field.key);
      }
    }
  });
});

function emptyPerson() {
  return {
    fullName: null,
    nickname: null,
    age: null,
    milestone: null,
    hostedBy: null,
    instagram: null,
  };
}
