"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

/**
 * ScrollReveal — animates children into view as they cross the viewport
 * threshold. Uses `IntersectionObserver` (no external library). Once the
 * element has been revealed it stays visible (one-shot).
 */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  /** "li" when the revealed element is itself a list item, so lists stay valid HTML. */
  as?: "div" | "li";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("scroll-revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const directionClass = {
    up: "scroll-reveal-up",
    down: "scroll-reveal-down",
    left: "scroll-reveal-left",
    right: "scroll-reveal-right",
    none: "scroll-reveal-fade",
  }[direction];

  return (
    <Tag
      ref={ref as RefObject<HTMLDivElement & HTMLLIElement>}
      className={`${directionClass} ${className}`}
    >
      {children}
    </Tag>
  );
}

/**
 * StaggerChildren — wraps multiple items with incremental reveal delay.
 */
export function StaggerChildren({
  children,
  className = "",
  baseDelay = 0,
  stagger = 100,
  direction = "up",
}: {
  children: ReactNode[];
  className?: string;
  baseDelay?: number;
  stagger?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}) {
  return (
    <>
      {children.map((child, i) => (
        <ScrollReveal
          key={i}
          className={className}
          delay={baseDelay + i * stagger}
          direction={direction}
        >
          {child}
        </ScrollReveal>
      ))}
    </>
  );
}
