"use client";

import { useEffect, useRef } from "react";

const PIXELS_PER_SECOND = 40;
const PAUSE_AT_END_MS = 1800;
const RESUME_AFTER_INTERACTION_MS = 4000;

/**
 * Slowly scrolls the surrounding `PhoneFrame` screen so a Homepage preview
 * shows the whole invitation, not just its cover. Rendered inside the
 * frame's children; it finds the screen via `data-phone-screen`.
 *
 * It stops while the pointer is over the screen and for a few seconds after
 * a touch, wheel or focus (so visitors can scroll it themselves), only runs
 * while the phone is on screen, and never runs for visitors who prefer
 * reduced motion.
 */
export function PhoneAutoScroll() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const screen = markerRef.current?.closest<HTMLElement>("[data-phone-screen]");
    const content = screen?.firstElementChild;
    if (!screen || !content) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = 0;
    let visible = false;
    let hovering = false;
    let pausedUntil = 0;
    let position = screen.scrollTop;

    // PhoneFrame shrinks the 390px-wide invitation with a CSS transform,
    // which leaves the scrollable height at the unscaled size. The visible
    // end is the scaled content's own height.
    const scrollEnd = () =>
      Math.max(0, content.getBoundingClientRect().height - screen.clientHeight);

    const step = (time: number) => {
      const elapsed = last ? time - last : 0;
      last = time;
      if (visible && !hovering && time >= pausedUntil) {
        const end = scrollEnd();
        if (position >= end - 1) {
          pausedUntil = time + PAUSE_AT_END_MS;
          position = 0;
          screen.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          position = Math.min(end, position + (elapsed / 1000) * PIXELS_PER_SECOND);
          screen.scrollTop = position;
        }
      }
      frame = requestAnimationFrame(step);
    };

    const pause = () => {
      pausedUntil = performance.now() + RESUME_AFTER_INTERACTION_MS;
      position = screen.scrollTop;
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovering = true;
    };
    const leave = () => {
      hovering = false;
      position = screen.scrollTop;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      position = screen.scrollTop;
    });
    observer.observe(screen);

    const pauseEvents = ["pointerdown", "wheel", "touchstart", "focusin"] as const;
    for (const name of pauseEvents) screen.addEventListener(name, pause, { passive: true });
    screen.addEventListener("pointerenter", enter);
    screen.addEventListener("pointerleave", leave);
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const name of pauseEvents) screen.removeEventListener(name, pause);
      screen.removeEventListener("pointerenter", enter);
      screen.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <span ref={markerRef} hidden />;
}
