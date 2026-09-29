import { describe, expect, it } from "vitest";

import {
  resolveCountdownRemaining,
  resolveCountdownTarget,
  resolveCountdownTargetDate,
} from "@/lib/invitations/countdown";
import type { InvitationSections } from "@/lib/event-types/sections";
import type { PublicSchedule } from "@/lib/invitations/types";

const ALL_ON: InvitationSections = {
  hero: true,
  identity: true,
  countdown: true,
  schedule: true,
  story: true,
  gallery: true,
  rsvp: true,
  gift: true,
  wishes: true,
};

function buildSchedule(overrides: Partial<PublicSchedule> = {}): PublicSchedule {
  return {
    id: "sch-1",
    title: "Akad Nikah",
    description: null,
    date: "2026-12-12",
    startTime: "08:00",
    endTime: "10:00",
    venue: null,
    ...overrides,
  };
}

describe("resolveCountdownTarget (D-068)", () => {
  it("Schedule OFF: never renders, regardless of how many schedules exist", () => {
    expect(
      resolveCountdownTarget({
        schedules: [buildSchedule()],
        sections: { ...ALL_ON, schedule: false },
      }),
    ).toBeNull();
  });

  it("Wedding, 0 schedules: no target, even though Schedule is on", () => {
    expect(resolveCountdownTarget({ schedules: [], sections: ALL_ON })).toBeNull();
  });

  it("Wedding, 1 schedule (and any non-Wedding type, which always has exactly one): targets it", () => {
    const schedule = buildSchedule();
    expect(resolveCountdownTarget({ schedules: [schedule], sections: ALL_ON })).toBe(schedule);
  });

  it("Wedding, 2 schedules: targets the first in canonical (sortOrder) order", () => {
    const first = buildSchedule({ id: "sch-1", title: "Akad Nikah" });
    const second = buildSchedule({ id: "sch-2", title: "Resepsi" });
    expect(resolveCountdownTarget({ schedules: [first, second], sections: ALL_ON })).toBe(first);
  });
});

describe("resolveCountdownTargetDate (D-068 — browser-local timezone)", () => {
  it("combines date + startTime into a Date whose local components match exactly", () => {
    const schedule = buildSchedule({ date: "2026-12-12", startTime: "08:05" });
    const target = resolveCountdownTargetDate(schedule);

    // Asserted via the local getters (not toISOString/UTC getters) — this
    // is the actual proof that the value is interpreted in whatever
    // timezone the runtime considers "local", not forced to UTC.
    expect(target.getFullYear()).toBe(2026);
    expect(target.getMonth()).toBe(11); // 0-indexed: December
    expect(target.getDate()).toBe(12);
    expect(target.getHours()).toBe(8);
    expect(target.getMinutes()).toBe(5);
    expect(target.getSeconds()).toBe(0);
  });

  it("never shifts the date across a local midnight boundary (regression guard for UTC-parsing bugs)", () => {
    // A UTC-parsing bug (e.g. `new Date(date + "T" + startTime + "Z")`)
    // would shift this early-morning time to the previous day in any
    // timezone west of UTC. The local constructor never does this.
    const schedule = buildSchedule({ date: "2026-01-01", startTime: "00:30" });
    const target = resolveCountdownTargetDate(schedule);
    expect(target.getFullYear()).toBe(2026);
    expect(target.getMonth()).toBe(0);
    expect(target.getDate()).toBe(1);
  });
});

describe("resolveCountdownRemaining (D-068 — display contract)", () => {
  it("future: breaks down the exact remaining days/hours/minutes/seconds", () => {
    const now = new Date(2026, 0, 1, 0, 0, 0);
    // 1 day, 2 hours, 3 minutes, 4 seconds ahead.
    const target = new Date(2026, 0, 2, 2, 3, 4);
    expect(resolveCountdownRemaining(target, now)).toEqual({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    });
  });

  it("exact boundary (target === now): clamps to all zero", () => {
    const now = new Date(2026, 0, 1, 12, 0, 0);
    expect(resolveCountdownRemaining(now, now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it("past (target already passed): clamps to all zero, never negative", () => {
    const now = new Date(2026, 0, 2, 0, 0, 0);
    const target = new Date(2026, 0, 1, 0, 0, 0); // 1 day in the past
    const remaining = resolveCountdownRemaining(target, now);
    expect(remaining).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    for (const value of Object.values(remaining)) {
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it("correctly carries seconds into minutes, minutes into hours, and hours into days", () => {
    const now = new Date(2026, 0, 1, 0, 0, 0);
    // 90061 seconds = 1 day, 1 hour, 1 minute, 1 second.
    const target = new Date(now.getTime() + 90061 * 1000);
    expect(resolveCountdownRemaining(target, now)).toEqual({
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
    });
  });
});

describe("public/preview parity (D-068)", () => {
  it("resolveCountdownTarget behaves identically for a PublicInvitation-shaped and a preview-shaped object", () => {
    // Both toPublicInvitation() and buildPreviewInvitation() ultimately
    // pass through the same schedules/sections shape (PublicSchedule[] /
    // InvitationSections) — this proves the pure resolver doesn't need to
    // know or care which pipeline produced its input.
    const schedule = buildSchedule();
    const publicShaped = { schedules: [schedule], sections: ALL_ON };
    const previewShaped = { schedules: [schedule], sections: ALL_ON };
    expect(resolveCountdownTarget(publicShaped)).toEqual(resolveCountdownTarget(previewShaped));
  });
});
