import { describe, expect, it } from "vitest";
import { EventType } from "@prisma/client";

import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";
import {
  buildPublicIdentity,
  EMPTY_BABY_FAMILY_IDENTITY,
  EMPTY_COUPLE_IDENTITY,
  emptyIdentityFor,
  getHeroHeading,
  getHeroScheduleDate,
  getMissingPublishRequirements,
  type CoupleIdentityData,
} from "@/lib/event-types/identity";
import { getIdentityFieldGroups } from "@/lib/event-types/identity-fields";
import type { InvitationSections } from "@/lib/event-types/sections";
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

const ALL_SECTIONS_ENABLED: InvitationSections = {
  hero: true,
  identity: true,
  schedule: true,
  story: true,
  gallery: true,
  rsvp: true,
  gift: true,
  wishes: true,
};

describe("getHeroHeading", () => {
  it("uses the identity's display name, else the event title, when Identity is enabled", () => {
    const identity = buildPublicIdentity("WEDDING", IDENTITY_BY_TYPE.WEDDING);
    expect(getHeroHeading({ title: "Judul", identity, sections: ALL_SECTIONS_ENABLED })).toBe(
      "Ayu & Budi",
    );
    expect(
      getHeroHeading({ title: "Rapat Tahunan", identity: null, sections: ALL_SECTIONS_ENABLED }),
    ).toBe("Rapat Tahunan");
    const corporate = buildPublicIdentity("CORPORATE", IDENTITY_BY_TYPE.CORPORATE);
    expect(
      getHeroHeading({
        title: "Rapat Tahunan",
        identity: corporate,
        sections: ALL_SECTIONS_ENABLED,
      }),
    ).toBe("Rapat Tahunan");
  });

  it("F4-09/D-064: falls back to the event title when Identity is disabled, even if identity data exists", () => {
    const identity = buildPublicIdentity("WEDDING", IDENTITY_BY_TYPE.WEDDING);
    expect(
      getHeroHeading({
        title: "Judul",
        identity,
        sections: { ...ALL_SECTIONS_ENABLED, identity: false },
      }),
    ).toBe("Judul");
  });
});

describe("getHeroScheduleDate", () => {
  const schedules = [
    {
      id: "s1",
      title: "Akad",
      description: null,
      date: "2026-12-12",
      startTime: "08:00",
      endTime: "10:00",
      venue: null,
    },
  ];

  it("returns the earliest schedule's date when Schedule is enabled", () => {
    expect(getHeroScheduleDate({ schedules, sections: ALL_SECTIONS_ENABLED })).toBe("2026-12-12");
  });

  it("returns null when there is no schedule", () => {
    expect(getHeroScheduleDate({ schedules: [], sections: ALL_SECTIONS_ENABLED })).toBeNull();
  });

  it("D-064: returns null when Schedule is disabled, even if schedule data exists", () => {
    expect(
      getHeroScheduleDate({ schedules, sections: { ...ALL_SECTIONS_ENABLED, schedule: false } }),
    ).toBeNull();
  });
});

describe("getMissingPublishRequirements", () => {
  it("is satisfied by every type's complete identity plus one venued schedule", () => {
    for (const type of ALL_TYPES) {
      expect(getMissingPublishRequirements(type, IDENTITY_BY_TYPE[type], 1, 1)).toEqual([]);
    }
  });

  it("lists each type's required identity information when empty (F4 canonical contract §8)", () => {
    const missing = (type: EventType) =>
      getMissingPublishRequirements(type, emptyIdentityFor(type), 1, 1);
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
      const missing = getMissingPublishRequirements(type, IDENTITY_BY_TYPE[type], 0, 0);
      expect(missing.includes("Tanggal acara (tambahkan minimal satu jadwal)")).toBe(
        type !== "WEDDING",
      );
    }
  });

  it("accepts a nickname in place of a full name, and one parent for Aqiqah (F4-04/05/06/07)", () => {
    expect(
      getMissingPublishRequirements(
        "BIRTHDAY",
        { family: "PERSON", data: { ...emptyPerson(), nickname: "Citra" } },
        1,
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
        1,
      ),
    ).toEqual([]);
  });

  it("treats another family's identity as missing", () => {
    expect(getMissingPublishRequirements("CORPORATE", IDENTITY_BY_TYPE.WEDDING, 1, 1)).toEqual([
      "Nama organisasi",
    ]);
  });

  // --- F4-09: agenda count & venue rule (docs/F4_CANONICAL_PUBLISH_CONTRACT.md §4) ---

  const VENUE_MESSAGE = "Lokasi acara (tambahkan venue pada jadwal yang belum memiliki lokasi)";
  const tooManyMessage = (max: number) => `Jumlah jadwal melebihi batas maksimal (${max} jadwal)`;

  describe("WEDDING — up to 2 agendas; venue only required once both agenda slots are used", () => {
    const identity = IDENTITY_BY_TYPE.WEDDING;

    it("0 agendas — PASS (unchanged Phase 0.9 baseline, not an F4-09 requirement)", () => {
      expect(getMissingPublishRequirements("WEDDING", identity, 0, 0)).toEqual([]);
    });

    it("1 agenda + no venue — PASS", () => {
      expect(getMissingPublishRequirements("WEDDING", identity, 1, 0)).toEqual([]);
    });

    it("1 agenda + venue — PASS", () => {
      expect(getMissingPublishRequirements("WEDDING", identity, 1, 1)).toEqual([]);
    });

    it("2 agendas + both venued — PASS", () => {
      expect(getMissingPublishRequirements("WEDDING", identity, 2, 2)).toEqual([]);
    });

    it("2 agendas + first agenda's venue null — FAIL", () => {
      // venuedScheduleCount = 1 covers "only one of the two has a venue,"
      // regardless of which position — the resolver doesn't distinguish
      // by index, only by count, matching the contract's "either agenda
      // unvenued → FAIL" (there is no ordering concept in the data model).
      expect(getMissingPublishRequirements("WEDDING", identity, 2, 1)).toEqual([VENUE_MESSAGE]);
    });

    it("2 agendas + second agenda's venue null — FAIL", () => {
      expect(getMissingPublishRequirements("WEDDING", identity, 2, 1)).toEqual([VENUE_MESSAGE]);
    });

    it("2 agendas + both venues null — FAIL", () => {
      expect(getMissingPublishRequirements("WEDDING", identity, 2, 0)).toEqual([VENUE_MESSAGE]);
    });

    it("3 agendas — FAIL (regardless of venue state), and never also reports a venue error", () => {
      expect(getMissingPublishRequirements("WEDDING", identity, 3, 3)).toEqual([tooManyMessage(2)]);
      expect(getMissingPublishRequirements("WEDDING", identity, 3, 0)).toEqual([tooManyMessage(2)]);
    });
  });

  describe.each(ALL_TYPES.filter((type) => type !== "WEDDING"))(
    "%s — exactly 1 agenda, venue required on it (F4-09 §4.4)",
    (type) => {
      const identity = IDENTITY_BY_TYPE[type];

      it("0 agendas — FAIL", () => {
        expect(getMissingPublishRequirements(type, identity, 0, 0)).toEqual([
          "Tanggal acara (tambahkan minimal satu jadwal)",
        ]);
      });

      it("1 agenda + venue — PASS", () => {
        expect(getMissingPublishRequirements(type, identity, 1, 1)).toEqual([]);
      });

      it("1 agenda + venue null — FAIL", () => {
        expect(getMissingPublishRequirements(type, identity, 1, 0)).toEqual([VENUE_MESSAGE]);
      });

      it("2 agendas, both venued — FAIL (agenda-count ceiling, independent of venue completeness)", () => {
        expect(getMissingPublishRequirements(type, identity, 2, 2)).toEqual([tooManyMessage(1)]);
      });

      it("2 agendas, one venue null — FAIL", () => {
        expect(getMissingPublishRequirements(type, identity, 2, 1)).toEqual([tooManyMessage(1)]);
      });
    },
  );

  it("F4 §11.1 Wedding — every full-name/nickname combination publishes; either side missing blocks it", () => {
    const couple = (bride: Partial<CoupleIdentityData>, groom: Partial<CoupleIdentityData>) => ({
      family: "COUPLE" as const,
      data: { ...EMPTY_COUPLE_IDENTITY, ...bride, ...groom },
    });

    // Valid: every full-name/nickname combination (1 agenda, no venue —
    // still PASS per the F4-09 Wedding rule verified above).
    expect(
      getMissingPublishRequirements(
        "WEDDING",
        couple({ brideFullName: "Ayu" }, { groomFullName: "Budi" }),
        1,
        0,
      ),
    ).toEqual([]);
    expect(
      getMissingPublishRequirements(
        "WEDDING",
        couple({ brideNickname: "Ayu" }, { groomNickname: "Budi" }),
        1,
        0,
      ),
    ).toEqual([]);
    expect(
      getMissingPublishRequirements(
        "WEDDING",
        couple({ brideFullName: "Ayu Lestari" }, { groomNickname: "Budi" }),
        1,
        0,
      ),
    ).toEqual([]);
    expect(
      getMissingPublishRequirements(
        "WEDDING",
        couple({ brideNickname: "Ayu" }, { groomFullName: "Budi Santoso" }),
        1,
        0,
      ),
    ).toEqual([]);

    // Invalid: either side entirely missing.
    expect(
      getMissingPublishRequirements("WEDDING", couple({}, { groomFullName: "Budi" }), 1, 1),
    ).toEqual(["Nama Mempelai Wanita"]);
    expect(
      getMissingPublishRequirements("WEDDING", couple({ brideFullName: "Ayu" }, {}), 1, 1),
    ).toEqual(["Nama Mempelai Pria"]);
  });

  it("F4 §11.5 Aqiqah — father-only, mother-only, and both-parents all satisfy the parent requirement; neither does not", () => {
    const baby = (
      overrides: Partial<{ babyFullName: string | null; babyNickname: string | null }>,
      father: string | null,
      mother: string | null,
    ) => ({
      family: "BABY_FAMILY" as const,
      data: {
        ...EMPTY_BABY_FAMILY_IDENTITY,
        babyFullName: null,
        babyNickname: null,
        ...overrides,
        fatherName: father,
        motherName: mother,
      },
    });

    expect(
      getMissingPublishRequirements("AQIQAH", baby({ babyFullName: "Rafa" }, "Rizky", null), 1, 1),
    ).toEqual([]);
    expect(
      getMissingPublishRequirements("AQIQAH", baby({ babyNickname: "Rafa" }, null, "Nadia"), 1, 1),
    ).toEqual([]);
    expect(
      getMissingPublishRequirements(
        "AQIQAH",
        baby({ babyFullName: "Rafa" }, "Rizky", "Nadia"),
        1,
        1,
      ),
    ).toEqual([]);
    expect(
      getMissingPublishRequirements(
        "AQIQAH",
        baby({ babyNickname: "Rafa" }, "Rizky", "Nadia"),
        1,
        1,
      ),
    ).toEqual([]);
    expect(
      getMissingPublishRequirements("AQIQAH", baby({ babyFullName: "Rafa" }, null, null), 1, 1),
    ).toEqual(["Nama orang tua"]);
    expect(getMissingPublishRequirements("AQIQAH", baby({}, "Rizky", "Nadia"), 1, 1)).toEqual([
      "Nama buah hati",
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
