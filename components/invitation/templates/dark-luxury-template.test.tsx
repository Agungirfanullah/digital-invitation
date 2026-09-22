import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { DarkLuxuryTemplate } from "@/components/invitation/templates/dark-luxury-template";
import {
  buildFullyPopulatedInvitation,
  buildMinimalInvitation,
} from "@/components/invitation/templates/test-fixtures";

describe("DarkLuxuryTemplate", () => {
  it("renders without crashing for a title-only event (no optional sections)", () => {
    const invitation = buildMinimalInvitation();
    expect(() => render(<DarkLuxuryTemplate invitation={invitation} />)).not.toThrow();
    expect(screen.getByText(invitation.title)).toBeInTheDocument();
    expect(screen.getByText("Bapak/Ibu/Saudara/i Tamu Undangan")).toBeInTheDocument();
  });

  it("renders without crashing for a fully populated event", () => {
    const invitation = buildFullyPopulatedInvitation();
    expect(() => render(<DarkLuxuryTemplate invitation={invitation} />)).not.toThrow();
    expect(screen.getByText("Ayu & Budi")).toBeInTheDocument();
    expect(screen.getByText("Akad Nikah")).toBeInTheDocument();
    expect(screen.getByText("Selamat menempuh hidup baru!")).toBeInTheDocument();
  });

  it("shows the resolved guest name in the hero when personalized", () => {
    const invitation = buildFullyPopulatedInvitation();
    render(<DarkLuxuryTemplate invitation={invitation} />);
    expect(screen.getByText("Dedi Pratama")).toBeInTheDocument();
  });

  it("renders whatever theme it's given as CSS custom properties on its root element (per-template default resolution itself is verified in lib/invitations/projection.test.ts, not here — this component only displays the already-resolved theme)", () => {
    const invitation = buildMinimalInvitation({
      theme: {
        ...buildMinimalInvitation().theme,
        backgroundColor: "#121110",
        textColor: "#ece7de",
      },
    });
    const { container } = render(<DarkLuxuryTemplate invitation={invitation} />);
    const main = container.querySelector("main");
    expect(main?.style.getPropertyValue("--ii-background")).toBe("#121110");
    expect(main?.style.getPropertyValue("--ii-text")).toBe("#ece7de");
  });
});
