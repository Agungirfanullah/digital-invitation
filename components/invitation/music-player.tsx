"use client";

import { useEffect, useRef, useState } from "react";

import { INVITATION_REVEAL_EVENT, type InvitationMusic } from "@/lib/invitations/music";

/**
 * Background music on the public invitation (D-109). Browsers only allow
 * sound after a user gesture, so it starts when the guest presses "Buka
 * Undangan" (the Opening gate dispatches INVITATION_REVEAL_EVENT inside
 * that click). Without an Opening gate it waits for the guest to press
 * play. A round button toggles play/pause; the music pauses while the tab
 * is hidden and resumes when the guest comes back if it was playing.
 */
export function MusicPlayer({
  music,
  belowGuestButton = false,
}: {
  music: InvitationMusic;
  /** Leaves room for the guest QR button, which sits in the same corner. */
  belowGuestButton?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const resumeOnReturn = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const start = () => {
      audio.play().catch(() => {
        // Autoplay refused (e.g. the browser's own policy): the button stays
        // available for the guest to start it.
      });
    };
    const onVisibility = () => {
      if (document.hidden) {
        resumeOnReturn.current = !audio.paused;
        audio.pause();
      } else if (resumeOnReturn.current) {
        resumeOnReturn.current = false;
        start();
      }
    };

    window.addEventListener(INVITATION_REVEAL_EVENT, start);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener(INVITATION_REVEAL_EVENT, start);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setFailed(true));
    else audio.pause();
  }

  if (failed) return null;

  const label = playing ? "Jeda musik" : "Putar musik";

  return (
    <>
      <audio
        ref={audioRef}
        src={music.url}
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-pressed={playing}
        title={music.title ? `${label}: ${music.title}` : label}
        className={`fixed right-4 z-40 flex size-11 items-center justify-center rounded-full border border-[color:var(--ii-secondary)] bg-[color:var(--ii-background)]/95 text-[color:var(--ii-primary)] shadow-lg backdrop-blur transition-colors hover:bg-[color:var(--ii-secondary)]/60 focus-visible:ring-2 focus-visible:ring-[color:var(--ii-accent)] focus-visible:outline-none ${
          belowGuestButton ? "top-[4.25rem]" : "top-4"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`size-5 ${playing ? "motion-safe:animate-[spin_6s_linear_infinite]" : ""}`}
        >
          {playing ? (
            <>
              <circle cx="12" cy="12" r="8.5" />
              <circle cx="12" cy="12" r="2.2" />
              <path d="M12 3.5a8.5 8.5 0 0 1 6 2.5" />
            </>
          ) : (
            <>
              <path d="M9 18V5.5l11-2V16" />
              <circle cx="6.5" cy="18" r="2.5" />
              <circle cx="17.5" cy="16" r="2.5" />
            </>
          )}
        </svg>
      </button>
    </>
  );
}
