"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";

import { PhoneFrame } from "@/components/invitation/phone-frame";
import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/marketing/icons";
import { TEMPLATE_STYLES, type TemplateStyle } from "@/lib/marketing/template-styles";

export interface ShowcaseTemplate {
  slug: string;
  name: string;
  style: TemplateStyle | null;
  /** The template's default palette, shown as small swatches. */
  colors: string[];
}

type Filter = "Semua" | TemplateStyle;

/**
 * The Template Showcase's interactive part: style filter chips and a
 * snap-scrolling row of phone previews. Filtering hides cards instead of
 * unmounting them, so the server-rendered previews are never rebuilt.
 */
export function TemplateCarousel({
  templates,
  previews,
}: {
  templates: ShowcaseTemplate[];
  previews: Record<string, ReactNode>;
}) {
  const [filter, setFilter] = useState<Filter>("Semua");
  const trackRef = useRef<HTMLUListElement>(null);

  const styles = TEMPLATE_STYLES.filter((style) => templates.some((t) => t.style === style));
  const filters: Filter[] = ["Semua", ...styles];
  const isShown = (template: ShowcaseTemplate) => filter === "Semua" || template.style === filter;

  const choose = (next: Filter) => {
    setFilter(next);
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="mt-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-6">
        <div
          role="group"
          aria-label="Saring template berdasarkan gaya"
          className="no-scrollbar -mx-5 flex w-[calc(100%+2.5rem)] gap-2 overflow-x-auto px-5 sm:mx-0 sm:w-auto sm:flex-wrap sm:px-0"
        >
          {filters.map((option) => {
            const count =
              option === "Semua"
                ? templates.length
                : templates.filter((t) => t.style === option).length;
            const active = filter === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => choose(option)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-card text-foreground/80 border-border hover:border-foreground/30"
                }`}
              >
                {option}
                <span className={`ml-1.5 text-xs ${active ? "opacity-70" : "opacity-50"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Template sebelumnya"
            className="border-border bg-card hover:bg-muted flex size-10 items-center justify-center rounded-full border transition-colors"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Template berikutnya"
            className="border-border bg-card hover:bg-muted flex size-10 items-center justify-center rounded-full border transition-colors"
          >
            <ChevronRightIcon className="size-5" />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label="Daftar template"
        className="no-scrollbar mt-8 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto px-5 pb-6 sm:scroll-px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] sm:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]"
      >
        {templates.map((template) => (
          <li
            key={template.slug}
            hidden={!isShown(template)}
            className="group w-[236px] shrink-0 snap-start"
          >
            <div className="border-border/60 bg-card rounded-[1.75rem] border p-3 shadow-xs transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl">
              <div className="bg-muted/50 rounded-[1.4rem] px-5 pt-5 pb-4">
                {/* A picture of the template: the demo link below is the real way in,
                    so the preview stays out of the tab order and screen readers. */}
                <div inert aria-hidden="true">
                  <PhoneFrame heightClassName="h-[380px]" compact>
                    {previews[template.slug]}
                  </PhoneFrame>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 pt-3.5 pb-1.5">
                <div className="min-w-0">
                  <h3 className="text-foreground truncate text-sm font-bold">{template.name}</h3>
                  <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                    {template.colors.map((color) => (
                      <span
                        key={color}
                        className="ring-border size-2.5 rounded-full ring-1"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="ml-0.5">{template.style ?? "Template"}</span>
                  </p>
                </div>
                <Link
                  href={`/demo/${template.slug}`}
                  target="_blank"
                  aria-label={`Lihat demo ${template.name}`}
                  className="bg-foreground text-background group-hover:bg-primary flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
                >
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
