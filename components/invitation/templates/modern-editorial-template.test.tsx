import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ModernEditorialTemplate } from "@/components/invitation/templates/modern-editorial-template";
import {
  buildFullyPopulatedInvitation,
  buildMinimalInvitation,
} from "@/components/invitation/templates/test-fixtures";

describe("ModernEditorialTemplate", () => {
  it("renders without crashing for a title-only event (no optional sections)", () => {
    const invitation = buildMinimalInvitation();
    expect(() => render(<ModernEditorialTemplate invitation={invitation} />)).not.toThrow();
    expect(screen.getByText(invitation.title)).toBeInTheDocument();
    expect(screen.getByText("Bapak/Ibu/Saudara/i Tamu Undangan")).toBeInTheDocument();
  });

  it("renders without crashing for a fully populated event", () => {
    const invitation = buildFullyPopulatedInvitation();
    expect(() => render(<ModernEditorialTemplate invitation={invitation} />)).not.toThrow();
    expect(screen.getByText("Ayu & Budi")).toBeInTheDocument();
    expect(screen.getByText("Akad Nikah")).toBeInTheDocument();
    expect(screen.getByText("Selamat menempuh hidup baru!")).toBeInTheDocument();
  });

  it("shows the resolved guest name in the hero when personalized", () => {
    const invitation = buildFullyPopulatedInvitation();
    render(<ModernEditorialTemplate invitation={invitation} />);
    expect(screen.getByText("Dedi Pratama")).toBeInTheDocument();
  });
});
