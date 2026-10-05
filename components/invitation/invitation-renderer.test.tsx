import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { buildFullyPopulatedInvitation } from "@/components/invitation/templates/test-fixtures";

describe("InvitationRenderer — Opening integration (D-069)", () => {
  it("public (no bypassOpening): wraps the template in the Opening gate", () => {
    const invitation = buildFullyPopulatedInvitation();
    render(<InvitationRenderer invitation={invitation} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buka Undangan" })).toBeInTheDocument();
  });

  it("editor preview (bypassOpening): renders the template directly, no gate at all", () => {
    const invitation = buildFullyPopulatedInvitation();
    render(<InvitationRenderer invitation={invitation} bypassOpening />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Buka Undangan" })).not.toBeInTheDocument();
    // The actual template content is visible immediately.
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("Opening disabled via configuration: renders the template directly, no gate, even without bypassOpening", () => {
    const invitation = buildFullyPopulatedInvitation({ openingEnabled: false });
    render(<InvitationRenderer invitation={invitation} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});

describe("InvitationRenderer — desktop cover panel", () => {
  it("public: renders the cover panel outside the Opening gate, hidden from assistive tech", () => {
    const base = buildFullyPopulatedInvitation();
    const photo = "https://example.com/cover.jpg";
    const invitation = { ...base, theme: { ...base.theme, backgroundImageUrl: photo } };
    render(<InvitationRenderer invitation={invitation} />);

    const panel = screen.getByTestId("desktop-cover-panel");
    expect(panel).toHaveAttribute("aria-hidden", "true");
    // Not inside the gate's visibility-hidden content wrapper, so it shows while the gate is up.
    expect(panel.closest('[style*="visibility"]')).toBeNull();
    expect(panel.querySelector("img")).toHaveAttribute("src", photo);
  });

  it("previews (bypassOpening): no cover panel, so narrow editor/Homepage previews are unaffected", () => {
    const invitation = buildFullyPopulatedInvitation();
    render(<InvitationRenderer invitation={invitation} bypassOpening />);

    expect(screen.queryByTestId("desktop-cover-panel")).not.toBeInTheDocument();
  });

  it("falls back to a plain frame instead of a broken image when there is no cover photo", () => {
    const base = buildFullyPopulatedInvitation();
    const invitation = { ...base, theme: { ...base.theme, backgroundImageUrl: null } };
    render(<InvitationRenderer invitation={invitation} />);

    expect(screen.getByTestId("desktop-cover-panel").querySelector("img")).toBeNull();
  });
});
