import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/dashboard" } }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

import { DashboardNav } from "@/components/dashboard/dashboard-nav";

function activeLabels(): string[] {
  return screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page")
    .map((link) => link.textContent ?? "");
}

describe("DashboardNav", () => {
  it("marks only Desain Undangan on the editor, not Pengaturan Acara (/edit is a prefix of /editor)", () => {
    pathname.current = "/dashboard/events/evt1/editor";
    render(<DashboardNav />);
    expect(activeLabels()).toEqual(["Undangan", "Desain Undangan"]);
  });

  it("marks Pengaturan Acara on the event settings page", () => {
    pathname.current = "/dashboard/events/evt1/edit";
    render(<DashboardNav />);
    expect(activeLabels()).toEqual(["Undangan", "Pengaturan Acara"]);
  });

  it("keeps a sub-page of a section active", () => {
    pathname.current = "/dashboard/events/evt1/guests/import";
    render(<DashboardNav />);
    expect(activeLabels()).toEqual(["Undangan", "Tamu"]);
  });
});
