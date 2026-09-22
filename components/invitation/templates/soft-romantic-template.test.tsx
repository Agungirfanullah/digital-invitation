import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { SoftRomanticTemplate } from "@/components/invitation/templates/soft-romantic-template";
import {
  buildFullyPopulatedInvitation,
  buildMinimalInvitation,
} from "@/components/invitation/templates/test-fixtures";

describe("SoftRomanticTemplate", () => {
  it("renders without crashing for a title-only event (no optional sections)", () => {
    const invitation = buildMinimalInvitation();
    expect(() => render(<SoftRomanticTemplate invitation={invitation} />)).not.toThrow();
    expect(screen.getByText(invitation.title)).toBeInTheDocument();
    expect(screen.getByText("Bapak/Ibu/Saudara/i Tamu Undangan")).toBeInTheDocument();
  });

  it("renders without crashing for a fully populated event", () => {
    const invitation = buildFullyPopulatedInvitation();
    expect(() => render(<SoftRomanticTemplate invitation={invitation} />)).not.toThrow();
    expect(screen.getByText("Ayu & Budi")).toBeInTheDocument();
    expect(screen.getByText("Akad Nikah")).toBeInTheDocument();
    expect(screen.getByText("Selamat menempuh hidup baru!")).toBeInTheDocument();
  });

  it("shows the resolved guest name in the hero when personalized", () => {
    const invitation = buildFullyPopulatedInvitation();
    render(<SoftRomanticTemplate invitation={invitation} />);
    expect(screen.getByText("Dedi Pratama")).toBeInTheDocument();
  });
});
