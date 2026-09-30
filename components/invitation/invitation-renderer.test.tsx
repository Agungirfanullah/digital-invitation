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
