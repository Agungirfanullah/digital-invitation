import "server-only";
import type {
  BabyFamilyProfile,
  EventType,
  HostProfile,
  OrganizationProfile,
  PersonProfile,
  Prisma,
  WeddingProfile,
} from "@prisma/client";

import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";
import { emptyIdentityFor, type IdentityProfileData } from "@/lib/event-types/identity";

/**
 * Every identity profile relation. Included together (each is a 1:1 join
 * on a unique `eventId`), then `toIdentityProfileData()` picks the one the
 * event type's family actually uses — any other row is ignored, never
 * rendered under the wrong family's terminology.
 */
export const IDENTITY_PROFILE_INCLUDE = {
  weddingProfile: true,
  personProfile: true,
  babyFamilyProfile: true,
  hostProfile: true,
  organizationProfile: true,
} satisfies Prisma.EventInclude;

export interface IdentityProfileRecords {
  type: EventType;
  weddingProfile: WeddingProfile | null;
  personProfile: PersonProfile | null;
  babyFamilyProfile: BabyFamilyProfile | null;
  hostProfile: HostProfile | null;
  organizationProfile: OrganizationProfile | null;
}

function toDateOnly(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

/** Prisma rows → canonical identity data. A missing row yields the family's empty identity. */
export function toIdentityProfileData(record: IdentityProfileRecords): IdentityProfileData {
  const family = EVENT_TYPE_CONFIG[record.type].family;

  switch (family) {
    case "COUPLE": {
      const p = record.weddingProfile;
      if (!p) return emptyIdentityFor(record.type);
      return {
        family,
        data: {
          brideFullName: p.brideFullName,
          brideNickname: p.brideNickname,
          brideFather: p.brideFather,
          brideMother: p.brideMother,
          brideInstagram: p.brideInstagram,
          groomFullName: p.groomFullName,
          groomNickname: p.groomNickname,
          groomFather: p.groomFather,
          groomMother: p.groomMother,
          groomInstagram: p.groomInstagram,
          yearsTogether: p.yearsTogether,
        },
      };
    }
    case "PERSON": {
      const p = record.personProfile;
      if (!p) return emptyIdentityFor(record.type);
      return {
        family,
        data: {
          fullName: p.fullName,
          nickname: p.nickname,
          age: p.age,
          milestone: p.milestone,
          hostedBy: p.hostedBy,
          instagram: p.instagram,
        },
      };
    }
    case "BABY_FAMILY": {
      const p = record.babyFamilyProfile;
      if (!p) return emptyIdentityFor(record.type);
      return {
        family,
        data: {
          babyFullName: p.babyFullName,
          babyNickname: p.babyNickname,
          fatherName: p.fatherName,
          motherName: p.motherName,
          birthDate: toDateOnly(p.birthDate),
          birthDetails: p.birthDetails,
        },
      };
    }
    case "HOST_GROUP": {
      const p = record.hostProfile;
      if (!p) return emptyIdentityFor(record.type);
      return {
        family,
        data: { hostName: p.hostName, occasionTheme: p.occasionTheme, contactInfo: p.contactInfo },
      };
    }
    case "ORGANIZATION": {
      const p = record.organizationProfile;
      if (!p) return emptyIdentityFor(record.type);
      return {
        family,
        data: {
          organizationName: p.organizationName,
          contactPerson: p.contactPerson,
          dressCode: p.dressCode,
        },
      };
    }
    case "GENERIC":
      return { family };
  }
}
