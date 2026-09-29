import type { EventType } from "@prisma/client";

import { EVENT_TYPE_CONFIG, type IdentityFamily } from "@/lib/event-types/config";
import type { InvitationSections } from "@/lib/event-types/sections";
import { formatIndonesianDate } from "@/lib/invitations/format";
import type { PublicIdentity, PublicIdentityMember, PublicSchedule } from "@/lib/invitations/types";

/**
 * Canonical, storage-shaped identity data per identity family. The editor
 * edits it, `lib/event-types/identity-record.ts` builds it from Prisma rows,
 * and `buildPublicIdentity()` is the ONE transformation from it to the
 * public `PublicIdentity` — used by both the public projection and the
 * editor preview, so the two cannot drift apart. Client-safe.
 */

/** Stored in `WeddingProfile` for every COUPLE-family type. */
export interface CoupleIdentityData {
  brideFullName: string | null;
  brideNickname: string | null;
  brideFather: string | null;
  brideMother: string | null;
  brideInstagram: string | null;
  groomFullName: string | null;
  groomNickname: string | null;
  groomFather: string | null;
  groomMother: string | null;
  groomInstagram: string | null;
  /** ANNIVERSARY only. */
  yearsTogether: number | null;
}

export interface PersonIdentityData {
  fullName: string | null;
  nickname: string | null;
  age: number | null;
  milestone: string | null;
  hostedBy: string | null;
  instagram: string | null;
}

export interface BabyFamilyIdentityData {
  babyFullName: string | null;
  babyNickname: string | null;
  fatherName: string | null;
  motherName: string | null;
  /** ISO date (YYYY-MM-DD). */
  birthDate: string | null;
  birthDetails: string | null;
}

export interface HostIdentityData {
  hostName: string | null;
  occasionTheme: string | null;
  contactInfo: string | null;
}

export interface OrganizationIdentityData {
  organizationName: string | null;
  contactPerson: string | null;
  dressCode: string | null;
}

export type IdentityProfileData =
  | { family: "COUPLE"; data: CoupleIdentityData }
  | { family: "PERSON"; data: PersonIdentityData }
  | { family: "BABY_FAMILY"; data: BabyFamilyIdentityData }
  | { family: "HOST_GROUP"; data: HostIdentityData }
  | { family: "ORGANIZATION"; data: OrganizationIdentityData }
  | { family: "GENERIC" };

export const EMPTY_COUPLE_IDENTITY: CoupleIdentityData = {
  brideFullName: null,
  brideNickname: null,
  brideFather: null,
  brideMother: null,
  brideInstagram: null,
  groomFullName: null,
  groomNickname: null,
  groomFather: null,
  groomMother: null,
  groomInstagram: null,
  yearsTogether: null,
};

export const EMPTY_PERSON_IDENTITY: PersonIdentityData = {
  fullName: null,
  nickname: null,
  age: null,
  milestone: null,
  hostedBy: null,
  instagram: null,
};

export const EMPTY_BABY_FAMILY_IDENTITY: BabyFamilyIdentityData = {
  babyFullName: null,
  babyNickname: null,
  fatherName: null,
  motherName: null,
  birthDate: null,
  birthDetails: null,
};

export const EMPTY_HOST_IDENTITY: HostIdentityData = {
  hostName: null,
  occasionTheme: null,
  contactInfo: null,
};

export const EMPTY_ORGANIZATION_IDENTITY: OrganizationIdentityData = {
  organizationName: null,
  contactPerson: null,
  dressCode: null,
};

/** The empty identity for an event type — what the editor starts from before any profile row exists. */
export function emptyIdentityFor(type: EventType): IdentityProfileData {
  return emptyIdentityForFamily(EVENT_TYPE_CONFIG[type].family);
}

export function emptyIdentityForFamily(family: IdentityFamily): IdentityProfileData {
  switch (family) {
    case "COUPLE":
      return { family, data: { ...EMPTY_COUPLE_IDENTITY } };
    case "PERSON":
      return { family, data: { ...EMPTY_PERSON_IDENTITY } };
    case "BABY_FAMILY":
      return { family, data: { ...EMPTY_BABY_FAMILY_IDENTITY } };
    case "HOST_GROUP":
      return { family, data: { ...EMPTY_HOST_IDENTITY } };
    case "ORGANIZATION":
      return { family, data: { ...EMPTY_ORGANIZATION_IDENTITY } };
    case "GENERIC":
      return { family };
  }
}

function member(
  role: string | null,
  name: string | null,
  instagram: string | null = null,
): PublicIdentityMember[] {
  return name ? [{ role, name, instagram }] : [];
}

function compact(values: (string | null | false)[]): string[] {
  return values.filter((value): value is string => Boolean(value));
}

function coupleDisplayName(data: CoupleIdentityData): string | null {
  if (data.brideNickname && data.groomNickname) {
    return `${data.brideNickname} & ${data.groomNickname}`;
  }
  if (data.brideFullName && data.groomFullName) {
    return `${data.brideFullName} & ${data.groomFullName}`;
  }
  return null;
}

function parentsLine(father: string | null, mother: string | null): string | null {
  if (father && mother) return `Buah hati dari ${father} & ${mother}`;
  if (father ?? mother) return `Buah hati dari ${father ?? mother}`;
  return null;
}

/**
 * Canonical identity → public identity. Returns null when there is nothing
 * real to show (GENERIC type, or a profile with no names/details) — there is
 * never fake identity data to fall back to.
 */
export function buildPublicIdentity(
  type: EventType,
  identity: IdentityProfileData,
): PublicIdentity | null {
  const config = EVENT_TYPE_CONFIG[type];
  // A mismatched family (e.g. a stale client state) renders nothing rather
  // than presenting one family's data with another family's terminology.
  if (identity.family !== config.family) return null;

  let displayName: string | null = null;
  let members: PublicIdentityMember[] = [];
  let details: string[] = [];

  switch (identity.family) {
    case "COUPLE": {
      const { data } = identity;
      const labels = config.coupleLabels;
      const firstRole = labels?.showRolesPublicly ? labels.first : null;
      const secondRole = labels?.showRolesPublicly ? labels.second : null;
      displayName = coupleDisplayName(data);
      members = [
        ...member(firstRole, data.brideFullName ?? data.brideNickname, data.brideInstagram),
        ...member(secondRole, data.groomFullName ?? data.groomNickname, data.groomInstagram),
      ];
      details = compact([
        type === "ANNIVERSARY" &&
          data.yearsTogether !== null &&
          `Merayakan ${data.yearsTogether} tahun bersama`,
      ]);
      break;
    }
    case "PERSON": {
      const { data } = identity;
      displayName = data.nickname ?? data.fullName;
      members = member(null, data.fullName ?? data.nickname, data.instagram);
      details = compact([
        data.age !== null && `Ulang tahun ke-${data.age}`,
        data.milestone,
        data.hostedBy && `Diselenggarakan oleh ${data.hostedBy}`,
      ]);
      break;
    }
    case "BABY_FAMILY": {
      const { data } = identity;
      displayName = data.babyNickname ?? data.babyFullName;
      members = member(null, data.babyFullName ?? data.babyNickname);
      details = compact([
        parentsLine(data.fatherName, data.motherName),
        data.birthDate && `Lahir pada ${formatIndonesianDate(data.birthDate)}`,
        data.birthDetails,
      ]);
      break;
    }
    case "HOST_GROUP": {
      const { data } = identity;
      // The event title is the gathering's purpose and stays the hero heading.
      members = member(null, data.hostName);
      details = compact([
        data.occasionTheme && `Tema: ${data.occasionTheme}`,
        data.contactInfo && `Kontak: ${data.contactInfo}`,
      ]);
      break;
    }
    case "ORGANIZATION": {
      const { data } = identity;
      members = member(null, data.organizationName);
      details = compact([
        data.contactPerson && `Narahubung: ${data.contactPerson}`,
        data.dressCode && `Dress code: ${data.dressCode}`,
      ]);
      break;
    }
    case "GENERIC":
      return null;
  }

  if (members.length === 0 && details.length === 0) return null;

  return {
    family: identity.family,
    heading: config.identityHeading,
    displayName,
    members,
    pairMembers: identity.family === "COUPLE",
    details,
  };
}

/**
 * The hero heading every template uses: the identity's display name, else
 * the event title. Respects the Identity section's own on/off state
 * (docs/DECISIONS.md D-064) — Hero must not consume identity data when the
 * owner has disabled Identity, even though the data is still present in
 * the projection for the (independently gated) dedicated Identity block.
 */
export function getHeroHeading(invitation: {
  title: string;
  identity: PublicIdentity | null;
  sections: InvitationSections;
}): string {
  const identity = invitation.sections.identity ? invitation.identity : null;
  return identity?.displayName ?? invitation.title;
}

/**
 * The date Hero shows, if any. Respects the Schedule section's own on/off
 * state (docs/DECISIONS.md D-064) — Hero must not consume schedule data
 * when the owner has disabled Schedule, even though the data is still
 * present in the projection for the (independently gated) dedicated
 * Schedule block. Returns `null` when there is no schedule, or when
 * Schedule is disabled — never a stale/fallback value.
 */
export function getHeroScheduleDate(invitation: {
  schedules: PublicSchedule[];
  sections: InvitationSections;
}): string | null {
  if (!invitation.sections.schedule) return null;
  return invitation.schedules[0]?.date ?? null;
}

/**
 * The required-information check behind publishing. Canonical source:
 * docs/F4_CANONICAL_PUBLISH_CONTRACT.md (supersedes PRD §13–§13.7 wording
 * for publish eligibility specifically — see the contract's §1 "Authority
 * Rule"). Returns human-readable, Indonesian labels of what's missing; an
 * empty list means the event may be published. Drafts may be saved
 * incomplete — the editor autosaves partial input — so this is enforced at
 * publish time.
 *
 * `scheduleCount` and `venuedScheduleCount` (how many of those schedules
 * have a non-null `venueId`) together resolve the F4-09 agenda-count and
 * venue rule (contract §4), which replaced the earlier unresolved
 * "every schedule vs. at least one schedule" question:
 *
 * - the schedule ("agenda") count must fall within
 *   `[config.requiresDate ? 1 : 0, config.maxAgendas]`;
 * - a venue is required on every schedule ONLY once the event has reached
 *   its type's maximum agenda count (`scheduleCount === config.maxAgendas`)
 *   — below that count, venue is not required at all. For every type
 *   except WEDDING, `maxAgendas` is 1, so this reduces to "the single
 *   agenda must have a venue." For WEDDING (`maxAgendas: 2`), a single
 *   agenda's venue stays optional, but a second agenda requires both to
 *   be venued.
 */
export function getMissingPublishRequirements(
  type: EventType,
  identity: IdentityProfileData,
  scheduleCount: number,
  venuedScheduleCount: number,
): string[] {
  const config = EVENT_TYPE_CONFIG[type];
  const missing: string[] = [];

  // A family mismatch is treated as "no identity entered yet".
  const current = identity.family === config.family ? identity : emptyIdentityFor(type);

  switch (current.family) {
    case "COUPLE": {
      const labels = config.coupleLabels;
      if (!(current.data.brideFullName ?? current.data.brideNickname)) {
        missing.push(`Nama ${labels?.first ?? "pasangan pertama"}`);
      }
      if (!(current.data.groomFullName ?? current.data.groomNickname)) {
        missing.push(`Nama ${labels?.second ?? "pasangan kedua"}`);
      }
      break;
    }
    case "PERSON":
      if (!(current.data.fullName ?? current.data.nickname)) {
        missing.push("Nama yang berulang tahun");
      }
      break;
    case "BABY_FAMILY":
      if (!(current.data.babyFullName ?? current.data.babyNickname)) {
        missing.push("Nama buah hati");
      }
      if (!(current.data.fatherName ?? current.data.motherName)) {
        missing.push("Nama orang tua");
      }
      break;
    case "HOST_GROUP":
      if (!current.data.hostName) missing.push("Nama tuan rumah");
      break;
    case "ORGANIZATION":
      if (!current.data.organizationName) missing.push("Nama organisasi");
      break;
    case "GENERIC":
      break;
  }

  // F4-09 (docs/F4_CANONICAL_PUBLISH_CONTRACT.md §4): agenda count, then
  // venue — checked as separate, mutually exclusive conditions so an
  // out-of-range count is never also reported as a venue problem.
  const minAgendas = config.requiresDate ? 1 : 0;
  if (scheduleCount < minAgendas) {
    missing.push("Tanggal acara (tambahkan minimal satu jadwal)");
  } else if (scheduleCount > config.maxAgendas) {
    missing.push(`Jumlah jadwal melebihi batas maksimal (${config.maxAgendas} jadwal)`);
  } else if (scheduleCount === config.maxAgendas && venuedScheduleCount < scheduleCount) {
    missing.push("Lokasi acara (tambahkan venue pada jadwal yang belum memiliki lokasi)");
  }

  return missing;
}
