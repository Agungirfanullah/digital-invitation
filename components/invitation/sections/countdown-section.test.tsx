import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { CountdownSection } from "@/components/invitation/sections/countdown-section";
import {
  buildFullyPopulatedInvitation,
  buildMinimalInvitation,
} from "@/components/invitation/templates/test-fixtures";

// `CountdownSection`'s own enable/disable toggle is applied one level up,
// by each template's `sections.countdown && <CountdownSection .../>`
// (exactly like Hero/RSVP/Wishes) — see
// `components/invitation/templates/cross-template.test.tsx` for that
// integration-level coverage. This component only owns the D-064
// Schedule-dependency guard below.
describe("CountdownSection (D-068)", () => {
  it("renders nothing when Schedule is disabled, even though Countdown is enabled (D-064 dependency)", () => {
    const invitation = buildFullyPopulatedInvitation({
      sections: {
        hero: true,
        identity: true,
        countdown: true,
        schedule: false,
        story: true,
        gallery: true,
        rsvp: true,
        gift: true,
        wishes: true,
      },
    });
    const { container } = render(<CountdownSection invitation={invitation} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a Wedding event with zero schedules, even though Countdown is enabled", () => {
    const invitation = buildMinimalInvitation({
      type: "WEDDING",
      sections: {
        hero: true,
        identity: true,
        countdown: true,
        schedule: true,
        story: true,
        gallery: true,
        rsvp: true,
        gift: true,
        wishes: true,
      },
      schedules: [],
    });
    const { container } = render(<CountdownSection invitation={invitation} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the target date/time statically and the ticking timer when enabled with a valid schedule", () => {
    const invitation = buildFullyPopulatedInvitation({
      sections: {
        hero: true,
        identity: true,
        countdown: true,
        schedule: true,
        story: true,
        gallery: true,
        rsvp: true,
        gift: true,
        wishes: true,
      },
    });
    render(<CountdownSection invitation={invitation} />);
    expect(screen.getByRole("region", { name: "Hitung mundur" })).toBeInTheDocument();
    expect(
      screen.getByText(/Menghitung mundur menuju 12 Desember 2026, pukul 08:00\./),
    ).toBeInTheDocument();
  });

  it("Wedding with two schedules: the static target text names the first schedule in canonical order", () => {
    const invitation = buildFullyPopulatedInvitation({
      sections: {
        hero: true,
        identity: true,
        countdown: true,
        schedule: true,
        story: true,
        gallery: true,
        rsvp: true,
        gift: true,
        wishes: true,
      },
      schedules: [
        {
          id: "sch-1",
          title: "Akad Nikah",
          description: null,
          date: "2026-12-12",
          startTime: "08:00",
          endTime: "10:00",
          venue: null,
        },
        {
          id: "sch-2",
          title: "Resepsi",
          description: null,
          date: "2026-12-12",
          startTime: "11:00",
          endTime: "14:00",
          venue: null,
        },
      ],
    });
    render(<CountdownSection invitation={invitation} />);
    expect(
      screen.getByText(/Menghitung mundur menuju 12 Desember 2026, pukul 08:00\./),
    ).toBeInTheDocument();
    expect(screen.queryByText(/pukul 11:00\./)).not.toBeInTheDocument();
  });
});
