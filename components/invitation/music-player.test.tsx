import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { INVITATION_REVEAL_EVENT } from "@/lib/invitations/music";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { MusicPlayer } from "@/components/invitation/music-player";
import { buildFullyPopulatedInvitation } from "@/components/invitation/templates/test-fixtures";

const music = {
  url: "https://storage.example/a.mp3",
  title: "Lagu Kita",
  source: "upload" as const,
};

describe("MusicPlayer", () => {
  let play: ReturnType<typeof vi.spyOn>;
  let pause: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // jsdom has no media playback; emulate the element's play/pause events.
    play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      Object.defineProperty(this, "paused", { value: false, configurable: true });
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
    pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      Object.defineProperty(this, "paused", { value: true, configurable: true });
      this.dispatchEvent(new Event("pause"));
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("starts when the guest opens the invitation, and the button pauses it", () => {
    render(<MusicPlayer music={music} />);
    expect(screen.getByRole("button", { name: "Putar musik" })).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event(INVITATION_REVEAL_EVENT));
    });
    expect(play).toHaveBeenCalledTimes(1);
    const button = screen.getByRole("button", { name: "Jeda musik" });
    expect(button).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(button);
    expect(pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Putar musik" })).toBeInTheDocument();
  });

  it("starts from the guest's 'Buka Undangan' click, and never plays in the editor's preview", () => {
    const invitation = { ...buildFullyPopulatedInvitation(), music, openingEnabled: true };
    const { unmount } = render(<InvitationRenderer invitation={invitation} />);
    fireEvent.click(screen.getByRole("button", { name: "Buka Undangan" }));
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Jeda musik" })).toBeInTheDocument();
    unmount();

    render(<InvitationRenderer invitation={invitation} bypassOpening />);
    expect(screen.queryByRole("button", { name: /musik/ })).not.toBeInTheDocument();
  });
});
