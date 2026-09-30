import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { OpeningGate } from "@/components/invitation/opening-gate";
import {
  buildFullyPopulatedInvitation,
  buildMinimalInvitation,
} from "@/components/invitation/templates/test-fixtures";

const ALL_ON = {
  hero: true,
  identity: true,
  countdown: false,
  schedule: true,
  story: true,
  gallery: true,
  rsvp: true,
  gift: true,
  wishes: true,
};

describe("OpeningGate (D-069)", () => {
  it("shows the gate on initial render, with the content hidden but present", () => {
    const invitation = buildFullyPopulatedInvitation({ sections: ALL_ON });
    render(
      <OpeningGate invitation={invitation}>
        <p>Konten Undangan</p>
      </OpeningGate>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buka Undangan" })).toBeInTheDocument();
    // Content is in the DOM (no second data-fetch/remount on reveal) but
    // hidden via visibility, not removed.
    const content = screen.getByText("Konten Undangan");
    expect(content).toBeInTheDocument();
    expect(content.closest('[style*="visibility"]')).toHaveStyle({ visibility: "hidden" });
  });

  it("clicking the CTA reveals the content and hides the gate", () => {
    const invitation = buildFullyPopulatedInvitation({ sections: ALL_ON });
    render(
      <OpeningGate invitation={invitation}>
        <p>Konten Undangan</p>
      </OpeningGate>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka Undangan" }));

    // aria-hidden="true" correctly removes it from the accessibility tree —
    // getByRole (unlike queryByRole with `hidden: true`) won't find it
    // anymore, which is exactly the property being verified here.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { hidden: true })).toHaveAttribute("aria-hidden", "true");
    const content = screen.getByText("Konten Undangan");
    expect(content.closest('[style*="visibility"]')).toHaveStyle({ visibility: "visible" });
  });

  it("is bypassed entirely when Opening is disabled — content renders directly, no dialog", () => {
    const invitation = buildFullyPopulatedInvitation({ sections: ALL_ON, openingEnabled: false });
    render(
      <OpeningGate invitation={invitation}>
        <p>Konten Undangan</p>
      </OpeningGate>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Konten Undangan")).toBeInTheDocument();
  });

  it("Identity ON: shows the identity-derived name", () => {
    const invitation = buildFullyPopulatedInvitation({ sections: ALL_ON });
    render(
      <OpeningGate invitation={invitation}>
        <p>content</p>
      </OpeningGate>,
    );
    expect(within(screen.getByRole("dialog")).getByText("Ayu & Budi")).toBeInTheDocument();
  });

  it("Identity OFF: does not consume identity data — falls back to the invitation title (D-064)", () => {
    const invitation = buildFullyPopulatedInvitation({
      sections: { ...ALL_ON, identity: false },
    });
    render(
      <OpeningGate invitation={invitation}>
        <p>content</p>
      </OpeningGate>,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Pernikahan Uji Coba")).toBeInTheDocument();
    expect(within(dialog).queryByText("Ayu & Budi")).not.toBeInTheDocument();
  });

  it("Schedule ON: shows the schedule-derived date", () => {
    const invitation = buildFullyPopulatedInvitation({ sections: ALL_ON });
    render(
      <OpeningGate invitation={invitation}>
        <p>content</p>
      </OpeningGate>,
    );
    expect(within(screen.getByRole("dialog")).getByText("12 Desember 2026")).toBeInTheDocument();
  });

  it("Schedule OFF: does not consume schedule data — no date leaks into Opening (D-064)", () => {
    const invitation = buildFullyPopulatedInvitation({
      sections: { ...ALL_ON, schedule: false },
    });
    render(
      <OpeningGate invitation={invitation}>
        <p>content</p>
      </OpeningGate>,
    );
    expect(
      within(screen.getByRole("dialog")).queryByText("12 Desember 2026"),
    ).not.toBeInTheDocument();
  });

  it("Hero OFF does not affect Opening — Opening still shows identity/schedule content", () => {
    const invitation = buildFullyPopulatedInvitation({ sections: { ...ALL_ON, hero: false } });
    render(
      <OpeningGate invitation={invitation}>
        <p>content</p>
      </OpeningGate>,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Ayu & Budi")).toBeInTheDocument();
    expect(within(dialog).getByText("12 Desember 2026")).toBeInTheDocument();
  });

  it("guest identity available: shows the personalized greeting", () => {
    const invitation = buildFullyPopulatedInvitation({
      sections: ALL_ON,
      guest: { displayName: "Dedi Pratama" },
    });
    render(
      <OpeningGate invitation={invitation}>
        <p>content</p>
      </OpeningGate>,
    );
    expect(within(screen.getByRole("dialog")).getByText("Dedi Pratama")).toBeInTheDocument();
  });

  it("guest identity unavailable: Opening still renders correctly, without a greeting", () => {
    const invitation = buildFullyPopulatedInvitation({ sections: ALL_ON, guest: null });
    render(
      <OpeningGate invitation={invitation}>
        <p>content</p>
      </OpeningGate>,
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Buka Undangan" })).toBeInTheDocument();
    expect(dialog).not.toHaveTextContent("Dear");
  });

  it("Opening enabled: locks page scroll while the gate is up and restores the exact previous value after reveal", () => {
    document.body.style.overflow = "auto"; // a distinct, non-empty baseline to prove exact restoration
    const invitation = buildMinimalInvitation({ sections: ALL_ON });
    const { unmount } = render(
      <OpeningGate invitation={invitation}>
        <p>content</p>
      </OpeningGate>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Buka Undangan" }));
    expect(document.body.style.overflow).toBe("auto");

    unmount();
    document.body.style.overflow = "";
  });

  // D-069-FIX regression test: the scroll-lock effect runs on every mount
  // (Rules of Hooks — it can't move below the `openingEnabled` early
  // return), so without an explicit guard it would lock scroll even
  // though no gate/CTA ever appears to release it — a permanent lock.
  // The previous test suite only checked DOM presence for the disabled
  // case, never this side effect, which is exactly how the bug shipped.
  it("Opening disabled: never touches body scroll at all — no lock, nothing to restore", () => {
    document.body.style.overflow = "auto"; // a distinct, non-empty baseline
    const invitation = buildFullyPopulatedInvitation({ sections: ALL_ON, openingEnabled: false });
    const { unmount } = render(
      <OpeningGate invitation={invitation}>
        <p>Konten Undangan</p>
      </OpeningGate>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Konten Undangan")).toBeInTheDocument();
    // Must remain exactly the pre-mount value — proves the effect never
    // ran `document.body.style.overflow = "hidden"` at all, not merely
    // that it was quickly restored.
    expect(document.body.style.overflow).toBe("auto");

    unmount();
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = "";
  });

  it("uses a simple opacity/fade transition with a reduced-motion CSS escape hatch, no animation dependency", () => {
    const invitation = buildMinimalInvitation({ sections: ALL_ON });
    render(
      <OpeningGate invitation={invitation}>
        <p>content</p>
      </OpeningGate>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("transition-opacity");
    expect(dialog.className).toContain("motion-reduce:transition-none");
  });
});
