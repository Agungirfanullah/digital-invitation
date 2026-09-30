/**
 * Integration tests for D-071 Onboarding MVP, run against the real
 * Supabase DEV Postgres database via Prisma (no mocking) — same rationale
 * as lib/events/ and lib/editor/: `completeOnboarding()` only orchestrates
 * already-proven services, but the orchestration itself (slug generation,
 * identity-family expansion, DRAFT status, template linkage) needs to be
 * proven against real queries.
 *
 * Every row created here is deleted in `afterEach`, regardless of outcome.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { IdentityFamilyMismatchError } from "@/lib/editor/errors";
import { SlugConflictError } from "@/lib/events/errors";
import { completeOnboarding } from "@/lib/onboarding/service";
import type { OnboardingInput } from "@/lib/onboarding/validation";

const createdUserIds: string[] = [];
const createdEventIds: string[] = [];
const createdTemplateIds: string[] = [];

afterEach(async () => {
  if (createdEventIds.length) {
    await prisma.event.deleteMany({ where: { id: { in: createdEventIds } } });
    createdEventIds.length = 0;
  }
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
  if (createdTemplateIds.length) {
    await prisma.template.deleteMany({ where: { id: { in: createdTemplateIds } } });
    createdTemplateIds.length = 0;
  }
});

async function createTestUser(label: string) {
  const user = await prisma.user.create({
    data: {
      id: `test-onboarding-${label}-${randomUUID()}`,
      email: `test-onboarding-${label}-${randomUUID()}@example.invalid`,
      name: `Test User ${label}`,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

/** A real, active, implemented template row — `selectTemplate()` rejects anything else. */
async function getImplementedTemplateSlug(): Promise<string> {
  const template = await prisma.template.findFirstOrThrow({
    where: { slug: "minimal-elegant", isActive: true },
  });
  return template.slug;
}

function coupleInput(overrides: Partial<OnboardingInput> = {}): OnboardingInput {
  return {
    type: "WEDDING",
    title: "Pernikahan Onboarding Uji Coba",
    date: "2026-12-12",
    identity: { family: "COUPLE", firstName: "Ayu", secondName: "Budi" },
    templateSlug: "minimal-elegant",
    ...overrides,
  };
}

describe("completeOnboarding", () => {
  it("creates a DRAFT event with the submitted type/title, a generated slug, a schedule, identity, and the selected template", async () => {
    const user = await createTestUser("happy-path");
    const templateSlug = await getImplementedTemplateSlug();

    const result = await completeOnboarding(user.id, coupleInput({ templateSlug }));
    createdEventIds.push(result.eventId);

    expect(result.warning).toBe(false);

    const event = await prisma.event.findUniqueOrThrow({
      where: { id: result.eventId },
      include: { schedules: true, weddingProfile: true, template: true },
    });

    expect(event.ownerId).toBe(user.id);
    expect(event.type).toBe("WEDDING");
    expect(event.title).toBe("Pernikahan Onboarding Uji Coba");
    expect(event.status).toBe("DRAFT");
    expect(event.publishedAt).toBeNull();
    expect(event.slug).toMatch(/^pernikahan-onboarding-uji-coba/);
    expect(event.template?.slug).toBe(templateSlug);

    expect(event.schedules).toHaveLength(1);
    expect(event.schedules[0].date.toISOString().slice(0, 10)).toBe("2026-12-12");

    expect(event.weddingProfile?.brideNickname).toBe("Ayu");
    expect(event.weddingProfile?.groomNickname).toBe("Budi");
  });

  it("retries with a numeric suffix when the generated slug already exists", async () => {
    const user = await createTestUser("slug-conflict");
    const templateSlug = await getImplementedTemplateSlug();

    const taken = await prisma.event.create({
      data: {
        ownerId: user.id,
        type: "WEDDING",
        title: "Existing",
        slug: "acara-unik",
        status: "DRAFT",
      },
    });
    createdEventIds.push(taken.id);

    const result = await completeOnboarding(
      user.id,
      coupleInput({ title: "Acara Unik", templateSlug }),
    );
    createdEventIds.push(result.eventId);

    const event = await prisma.event.findUniqueOrThrow({ where: { id: result.eventId } });
    expect(event.slug).toBe("acara-unik-2");
  });

  it("PERSON family: stores the single name via nickname, not a couple profile", async () => {
    const user = await createTestUser("person");
    const templateSlug = await getImplementedTemplateSlug();

    const result = await completeOnboarding(
      user.id,
      coupleInput({
        type: "BIRTHDAY",
        identity: { family: "PERSON", name: "Citra" },
        templateSlug,
      }),
    );
    createdEventIds.push(result.eventId);

    const event = await prisma.event.findUniqueOrThrow({
      where: { id: result.eventId },
      include: { personProfile: true, weddingProfile: true },
    });
    expect(event.personProfile?.nickname).toBe("Citra");
    expect(event.weddingProfile).toBeNull();
  });

  it("GENERIC (OTHER): creates the DRAFT event with no identity profile at all", async () => {
    const user = await createTestUser("generic");
    const templateSlug = await getImplementedTemplateSlug();

    const result = await completeOnboarding(
      user.id,
      coupleInput({ type: "OTHER", identity: { family: "GENERIC" }, templateSlug }),
    );
    createdEventIds.push(result.eventId);

    const event = await prisma.event.findUniqueOrThrow({
      where: { id: result.eventId },
      include: {
        weddingProfile: true,
        personProfile: true,
        babyFamilyProfile: true,
        hostProfile: true,
        organizationProfile: true,
      },
    });
    expect(event.weddingProfile).toBeNull();
    expect(event.personProfile).toBeNull();
    expect(event.babyFamilyProfile).toBeNull();
    expect(event.hostProfile).toBeNull();
    expect(event.organizationProfile).toBeNull();
  });

  it("rejects an identity family that doesn't match the event type, and creates no event at all", async () => {
    const user = await createTestUser("mismatch");
    const templateSlug = await getImplementedTemplateSlug();

    await expect(
      completeOnboarding(
        user.id,
        coupleInput({
          type: "BIRTHDAY",
          identity: { family: "COUPLE", firstName: "A", secondName: "B" },
          templateSlug,
        }),
      ),
    ).rejects.toThrow(IdentityFamilyMismatchError);

    const events = await prisma.event.findMany({ where: { ownerId: user.id } });
    expect(events).toHaveLength(0);
  });

  it("exhausting the slug retry budget throws SlugConflictError", async () => {
    const user = await createTestUser("slug-exhausted");
    const templateSlug = await getImplementedTemplateSlug();

    const base = "duplikat";
    const conflicting = await Promise.all(
      [base, `${base}-2`, `${base}-3`, `${base}-4`, `${base}-5`].map((slug) =>
        prisma.event.create({
          data: { ownerId: user.id, type: "WEDDING", title: slug, slug, status: "DRAFT" },
        }),
      ),
    );
    createdEventIds.push(...conflicting.map((event) => event.id));

    await expect(
      completeOnboarding(user.id, coupleInput({ title: "Duplikat", templateSlug })),
    ).rejects.toThrow(SlugConflictError);
  });
});
