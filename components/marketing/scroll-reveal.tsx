"use client";

import { useEffect, useRef, type ReactNode } from "react";

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
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}) {
  const ref = useRef<HTMLDivElement>(null);

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
    <div ref={ref} className={`${directionClass} ${className}`}>
      {children}
    </div>
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
