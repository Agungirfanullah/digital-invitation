import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";

import { CountdownTimer } from "@/components/invitation/sections/countdown-timer";
import type { PublicSchedule } from "@/lib/invitations/types";

function buildSchedule(overrides: Partial<PublicSchedule> = {}): PublicSchedule {
  return {
    id: "sch-1",
    title: "Akad Nikah",
    description: null,
    date: "2026-01-02",
    startTime: "00:00",
    endTime: "01:00",
    venue: null,
    ...overrides,
  };
}

describe("CountdownTimer (D-068 — timer behavior)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the correct remaining time immediately on mount, without waiting a full second", () => {
    // Target is exactly 1 day away from the fixed system time above.
    const { container } = render(<CountdownTimer schedule={buildSchedule()} />);
    expect(container.textContent).toContain("1");
    // 4 unit boxes: days, hours, minutes, seconds.
    expect(container.querySelectorAll("p.text-2xl")).toHaveLength(4);
  });

  it("ticks down once per second", () => {
    // Target (2026-01-02T00:00) is exactly 1 day ahead of the fixed system
    // time (2026-01-01T00:00). Advancing 1 real second of fake time must
    // re-render with updated numbers, proving a live interval is actually
    // running — not a one-shot computation frozen at mount.
    const { container } = render(<CountdownTimer schedule={buildSchedule()} />);
    const before = container.textContent;
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const after = container.textContent;
    expect(after).not.toBe(before);
  });

  it("clamps to all-zero once the target has passed, and never goes negative on further ticks", () => {
    // Target is in the past relative to the fixed system time.
    const { container } = render(
      <CountdownTimer schedule={buildSchedule({ date: "2020-01-01", startTime: "00:00" })} />,
    );
    const zeros = container.querySelectorAll("p.text-2xl");
    for (const el of zeros) {
      expect(el.textContent).toBe("0");
    }

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    for (const el of container.querySelectorAll("p.text-2xl")) {
      expect(el.textContent).toBe("0");
      expect(Number(el.textContent)).toBeGreaterThanOrEqual(0);
    }
  });

  it("cleans up its interval on unmount — no leaked timer", () => {
    const { unmount } = render(<CountdownTimer schedule={buildSchedule()} />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
