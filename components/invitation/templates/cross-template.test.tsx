import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { resolveTemplateComponent } from "@/lib/invitations/templates/registry";
import {
  buildFullyPopulatedInvitation,
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

  it("renders a non-wedding event with no WeddingProfile using the title fallback, never crashing", () => {
    const invitation = buildMinimalInvitation({
      type: "BIRTHDAY",
      title: "Ulang Tahun Ke-30 Citra",
      weddingProfile: null,
    });
    expect(() => render(<Template invitation={invitation} />)).not.toThrow();
    expect(screen.getByText("Ulang Tahun Ke-30 Citra")).toBeInTheDocument();
  });

  it("renders a 150-character event title without crashing", () => {
    const longTitle = "A".repeat(150);
    const invitation = buildMinimalInvitation({ title: longTitle, weddingProfile: null });
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
});
