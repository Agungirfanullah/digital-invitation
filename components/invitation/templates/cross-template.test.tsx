import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { EventType } from "@prisma/client";

import { EVENT_TYPE_CONFIG } from "@/lib/event-types/config";
import type { InvitationSections } from "@/lib/event-types/sections";
import { resolveTemplateComponent } from "@/lib/invitations/templates/registry";
import {
  buildFullyPopulatedInvitation,
  buildInvitationForType,
  buildMinimalInvitation,
} from "@/components/invitation/templates/test-fixtures";

/**
 * Cross-cutting edge-case coverage for all 6 registered templates at
 * once, rather than duplicating the same scenario 6 times per template
 * file — see the Phase 3 design audit §13's "do not demand a huge number
 * of tests without justification." Horizontal-overflow verification
 * itself happens in Playwright (a real layout engine); these tests verify
 * the data-correctness side: nothing crashes, and the right fallback
 * content actually renders.
 */
const ALL_SLUGS = [
  "minimal-elegant",
  "modern-editorial",
  "floral-romance",
  "dark-luxury",
  "traditional-nusantara",
  "soft-romantic",
];

describe.each(ALL_SLUGS)("%s — edge cases", (slug) => {
  const Template = resolveTemplateComponent(slug);

  it("renders a non-wedding event with no identity profile using the title fallback, never crashing", () => {
    const invitation = buildMinimalInvitation({
      type: "BIRTHDAY",
      title: "Ulang Tahun Ke-30 Citra",
      identity: null,
    });
    expect(() => render(<Template invitation={invitation} />)).not.toThrow();
    expect(screen.getByText("Ulang Tahun Ke-30 Citra")).toBeInTheDocument();
  });

  it("renders a 150-character event title without crashing", () => {
    const longTitle = "A".repeat(150);
    const invitation = buildMinimalInvitation({ title: longTitle, identity: null });
    expect(() => render(<Template invitation={invitation} />)).not.toThrow();
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it("renders a 120-character personalized guest name without crashing", () => {
    const longName = "B".repeat(120);
    const invitation = buildMinimalInvitation({ guest: { displayName: longName } });
    expect(() => render(<Template invitation={invitation} />)).not.toThrow();
    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  it("renders a 500-character venue address without crashing", () => {
    const longAddress = "Jl. Uji Coba ".repeat(38).trim(); // ~494 chars — trimmed to match RTL's whitespace-normalized query
    const invitation = buildFullyPopulatedInvitation({
      schedules: [
        {
          id: "sch-1",
          title: "Akad Nikah",
          description: null,
          date: "2026-12-12",
          startTime: "08:00",
          endTime: "10:00",
          venue: {
            name: "Gedung Serbaguna",
            address: longAddress,
            mapUrl: null,
            latitude: null,
            longitude: null,
          },
        },
      ],
    });
    expect(() => render(<Template invitation={invitation} />)).not.toThrow();
    expect(screen.getByText(longAddress)).toBeInTheDocument();
  });

  it("renders a 500-character wish message without crashing", () => {
    const longMessage = "Selamat menempuh hidup baru! ".repeat(17).trim(); // ~493 chars — trimmed to match RTL's whitespace-normalized query
    const invitation = buildFullyPopulatedInvitation({
      wishes: [{ id: "wish-1", name: "Eka Wijaya", message: longMessage, createdAt: new Date() }],
    });
    expect(() => render(<Template invitation={invitation} />)).not.toThrow();
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it("renders an anonymous (non-personalized) visit correctly — no submittable RSVP/Wish form", () => {
    const invitation = buildFullyPopulatedInvitation({ guest: null });
    render(<Template invitation={invitation} rsvp={null} wishGuest={null} />);
    expect(
      screen.getByText("RSVP hanya dapat diisi melalui tautan undangan pribadi Anda."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ucapan hanya dapat dikirim melalui tautan undangan pribadi Anda."),
    ).toBeInTheDocument();
  });

  it("Wedding regression: couple hero heading, 'Mempelai' section, both names and the doa-restu closing", () => {
    render(<Template invitation={buildFullyPopulatedInvitation()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Ayu & Budi" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mempelai" })).toBeInTheDocument();
    expect(screen.getByText("Ayu Lestari")).toBeInTheDocument();
    expect(screen.getByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("@ayulestari")).toBeInTheDocument();
    expect(screen.getByText(/memberikan doa restu\./)).toBeInTheDocument();
    // Parents were never public and still aren't.
    expect(screen.queryByText(/Bapak Lestari/)).not.toBeInTheDocument();
  });

  it("hides owner-disabled dedicated sections (identity, schedule, RSVP, wishes) while Hero stays on", () => {
    const invitation = buildFullyPopulatedInvitation({
      sections: {
        hero: true,
        identity: false,
        schedule: false,
        story: true,
        gallery: true,
        rsvp: false,
        gift: true,
        wishes: false,
      },
    });
    render(<Template invitation={invitation} rsvp={null} wishGuest={null} />);
    expect(screen.queryByRole("heading", { name: "Mempelai" })).not.toBeInTheDocument();
    expect(screen.queryByText("Akad Nikah")).not.toBeInTheDocument();
    expect(screen.queryByText(/RSVP hanya dapat diisi/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ucapan hanya dapat dikirim/)).not.toBeInTheDocument();
    // Hero itself is on, but per D-064 it must not consume the disabled
    // Identity section's data — it falls back to the event title, not the
    // couple's names.
    expect(
      screen.getByRole("heading", { level: 1, name: "Pernikahan Uji Coba" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Ayu & Budi" })).not.toBeInTheDocument();
  });

  // --- D-064: Hero is independently toggleable, and must not consume a --
  // --- disabled Identity/Schedule section's content. -------------------

  const ALL_SECTIONS_ON: InvitationSections = {
    hero: true,
    identity: true,
    schedule: true,
    story: true,
    gallery: true,
    rsvp: true,
    gift: true,
    wishes: true,
  };

  const HERO_DEPENDENCY_CASES: {
    label: string;
    sections: InvitationSections;
    heroRendered: boolean;
    expectDisplayName: boolean;
    expectDate: boolean;
  }[] = [
    {
      label: "Hero OFF, Identity ON, Schedule ON → Hero absent",
      sections: { ...ALL_SECTIONS_ON, hero: false },
      heroRendered: false,
      expectDisplayName: false,
      expectDate: false,
    },
    {
      label: "Hero ON, Identity ON, Schedule ON → existing Hero content preserved",
      sections: ALL_SECTIONS_ON,
      heroRendered: true,
      expectDisplayName: true,
      expectDate: true,
    },
    {
      label: "Hero ON, Identity OFF, Schedule ON → no identity-derived Hero content",
      sections: { ...ALL_SECTIONS_ON, identity: false },
      heroRendered: true,
      expectDisplayName: false,
      expectDate: true,
    },
    {
      label: "Hero ON, Identity ON, Schedule OFF → no schedule-derived Hero content",
      sections: { ...ALL_SECTIONS_ON, schedule: false },
      heroRendered: true,
      expectDisplayName: true,
      expectDate: false,
    },
    {
      label: "Hero ON, Identity OFF, Schedule OFF → no identity/schedule-derived Hero content",
      sections: { ...ALL_SECTIONS_ON, identity: false, schedule: false },
      heroRendered: true,
      expectDisplayName: false,
      expectDate: false,
    },
  ];

  it.each(HERO_DEPENDENCY_CASES)(
    "$label",
    ({ sections, heroRendered, expectDisplayName, expectDate }) => {
      const invitation = buildFullyPopulatedInvitation({ sections });
      render(<Template invitation={invitation} rsvp={null} wishGuest={null} />);

      const heroRegion = screen.queryByRole("region", { name: "Sampul undangan" });

      if (!heroRendered) {
        expect(heroRegion).not.toBeInTheDocument();
        // Hero OFF must not disable Identity/Schedule — both are ON in this case.
        expect(screen.getByRole("heading", { name: "Mempelai" })).toBeInTheDocument();
        expect(screen.getByText("Akad Nikah")).toBeInTheDocument();
        return;
      }

      expect(heroRegion).not.toBeNull();
      const heroHeading = within(heroRegion!).getByRole("heading", { level: 1 });
      expect(heroHeading).toHaveTextContent(
        expectDisplayName ? "Ayu & Budi" : "Pernikahan Uji Coba",
      );

      const heroDate = within(heroRegion!).queryByText("12 Desember 2026");
      if (expectDate) {
        expect(heroDate).toBeInTheDocument();
      } else {
        expect(heroDate).not.toBeInTheDocument();
      }

      // Identity/Schedule independence: their own dedicated blocks always
      // follow their own toggle, regardless of what Hero decided to show.
      const identityHeading = screen.queryByRole("heading", { name: "Mempelai" });
      expect(identityHeading === null).toBe(!sections.identity);
      const scheduleTitle = screen.queryByText("Akad Nikah");
      expect(scheduleTitle === null).toBe(!sections.schedule);
    },
  );
});

/** Expected public presentation per event type — heading of the identity section, the hero heading, and a type-specific detail line. */
const TYPE_EXPECTATIONS: Record<
  EventType,
  { identityHeading: string | null; hero: string; detail: string | null }
> = {
  WEDDING: { identityHeading: "Mempelai", hero: "Ayu & Budi", detail: null },
  ENGAGEMENT: { identityHeading: "Calon Mempelai", hero: "Ayu & Budi", detail: null },
  ANNIVERSARY: {
    identityHeading: "Pasangan",
    hero: "Ayu & Budi",
    detail: "Merayakan 25 tahun bersama",
  },
  BIRTHDAY: { identityHeading: "Yang Berulang Tahun", hero: "Citra", detail: "Ulang tahun ke-17" },
  AQIQAH: {
    identityHeading: "Buah Hati Kami",
    hero: "Rafa",
    detail: "Buah hati dari Rizky Pratama & Nadia Putri",
  },
  GATHERING: {
    identityHeading: "Tuan Rumah",
    hero: "Acara GATHERING",
    detail: "Tema: Nuansa Putih",
  },
  CORPORATE: {
    identityHeading: "Penyelenggara",
    hero: "Acara CORPORATE",
    detail: "Dress code: Batik",
  },
  OTHER: { identityHeading: null, hero: "Acara OTHER", detail: null },
};

const ALL_TYPES = Object.keys(TYPE_EXPECTATIONS) as EventType[];
const NON_WEDDING_TERMINOLOGY_TYPES: EventType[] = [
  "ANNIVERSARY",
  "BIRTHDAY",
  "AQIQAH",
  "GATHERING",
  "CORPORATE",
  "OTHER",
];

describe.each(ALL_SLUGS)("%s — every event type", (slug) => {
  const Template = resolveTemplateComponent(slug);

  it.each(ALL_TYPES)("renders %s with its own identity, terminology and closing", (type) => {
    const expected = TYPE_EXPECTATIONS[type];
    render(<Template invitation={buildInvitationForType(type)} />);

    expect(screen.getByRole("heading", { level: 1, name: expected.hero })).toBeInTheDocument();
    if (expected.identityHeading) {
      expect(screen.getByRole("heading", { name: expected.identityHeading })).toBeInTheDocument();
    }
    if (expected.detail) expect(screen.getByText(expected.detail)).toBeInTheDocument();
    expect(screen.getByText(EVENT_TYPE_CONFIG[type].closingMessage)).toBeInTheDocument();
  });

  it.each(NON_WEDDING_TERMINOLOGY_TYPES)("never shows wedding terminology for %s", (type) => {
    render(<Template invitation={buildInvitationForType(type)} />);
    expect(screen.queryByText(/Mempelai/)).not.toBeInTheDocument();
    expect(screen.queryByText(/doa restu/)).not.toBeInTheDocument();
  });
});
