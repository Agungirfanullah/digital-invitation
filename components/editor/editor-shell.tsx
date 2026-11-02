"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

import type { EditorEventData, EditorTemplateOption } from "@/lib/editor/types";
import { buildPreviewInvitation } from "@/lib/editor/preview";
import { EVENT_STATUS_LABELS } from "@/lib/events/labels";
import { Button } from "@/components/ui/button";
import {
  EditorSidebar,
  getEditorSections,
  type EditorSectionKey,
} from "@/components/editor/editor-sidebar";
import { EditorPreview } from "@/components/editor/editor-preview";
import { SaveStatusIndicator } from "@/components/editor/save-status";
import type { SaveStatus } from "@/components/editor/use-autosave";
import { IdentityForm } from "@/components/editor/sections/identity-form";
import { SectionsForm } from "@/components/editor/sections/sections-form";
import { ThemeForm } from "@/components/editor/sections/theme-form";
import { TemplateForm } from "@/components/editor/sections/template-form";
import { ScheduleForm } from "@/components/editor/sections/schedule-form";
import { LoveStoryForm } from "@/components/editor/sections/love-story-form";
import { GalleryForm } from "@/components/editor/sections/gallery-form";

export function EditorShell({
  initialEvent,
  templates,
  templatePreviews,
}: {
  initialEvent: EditorEventData;
  templates: EditorTemplateOption[];
  /** Server-rendered demo of each implemented template, keyed by slug (see the editor page). */
  templatePreviews: Record<string, ReactNode>;
}) {
  const { eventId, type } = initialEvent;

  const [activeSection, setActiveSection] = useState<EditorSectionKey>(
    () => getEditorSections(type)[0].key,
  );
  const [identity, setIdentity] = useState(initialEvent.identity);
  const [sectionOverrides, setSectionOverrides] = useState(initialEvent.sectionOverrides);
  const [sectionOrder, setSectionOrder] = useState(initialEvent.sectionOrder);
  const [theme, setTheme] = useState(initialEvent.theme);
  const [templateKey, setTemplateKey] = useState(initialEvent.templateKey);
  const [schedules, setSchedules] = useState(initialEvent.schedules);
  const [loveStory, setLoveStory] = useState(initialEvent.loveStory);
  const [gallery, setGallery] = useState(initialEvent.gallery);
  const [previewOpenOnMobile, setPreviewOpenOnMobile] = useState(false);

  const [headerStatus, setHeaderStatus] = useState<SaveStatus>("idle");
  const [headerError, setHeaderError] = useState<string | undefined>();

  function changeSection(section: EditorSectionKey) {
    setActiveSection(section);
    setHeaderStatus("idle");
    setHeaderError(undefined);
  }

  function reportStatus(status: SaveStatus, error?: string) {
    setHeaderStatus(status);
    setHeaderError(error);
  }

  const previewInvitation = useMemo(
    () =>
      buildPreviewInvitation({
        eventId: initialEvent.eventId,
        slug: initialEvent.slug,
        type: initialEvent.type,
        title: initialEvent.title,
        description: initialEvent.description,
        templateKey,
        identity,
        sectionOverrides,
        sectionOrder,
        openingEnabled: initialEvent.openingEnabled,
        theme,
        schedules,
        loveStory,
        gallery,
      }),
    [
      initialEvent,
      templateKey,
      identity,
      sectionOverrides,
      sectionOrder,
      theme,
      schedules,
      loveStory,
      gallery,
    ],
  );

  const isPublished = initialEvent.status === "PUBLISHED";

  return (
    <div className="border-border/60 bg-card flex min-h-[calc(100dvh-8rem)] flex-col rounded-3xl border shadow-sm">
      <header className="border-border/60 flex flex-wrap items-center justify-between gap-3 rounded-t-3xl border-b px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/dashboard/events/${eventId}`}
            aria-label="Kembali ke ringkasan acara"
            title="Kembali ke ringkasan acara"
            className="group border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30 focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-full border transition-all outline-none focus-visible:ring-2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-4 transition-transform group-hover:-translate-x-0.5"
            >
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-tight">{initialEvent.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs">
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-amber-500"}`}
              />
              <span className={isPublished ? "text-emerald-700" : "text-amber-700"}>
                {EVENT_STATUS_LABELS[initialEvent.status]}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SaveStatusIndicator status={headerStatus} error={headerError} />
          {isPublished && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden rounded-full sm:inline-flex"
            >
              <a href={`/invite/${initialEvent.slug}`} target="_blank" rel="noopener noreferrer">
                Lihat undangan
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="size-3.5"
                >
                  <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                </svg>
              </a>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="rounded-full lg:hidden"
            onClick={() => setPreviewOpenOnMobile(true)}
          >
            Pratinjau
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col 2xl:flex-row">
          <EditorSidebar type={type} active={activeSection} onChange={changeSection} />

          <main className="@container min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
            <div className="animate-fade-in mx-auto max-w-2xl space-y-6" key={activeSection}>
              {activeSection === "identity" && identity.family !== "GENERIC" && (
                <IdentityForm
                  eventId={eventId}
                  type={type}
                  value={identity}
                  onSaved={setIdentity}
                  onStatusChange={reportStatus}
                />
              )}
              {activeSection === "schedule" && (
                <ScheduleForm eventId={eventId} items={schedules} onChange={setSchedules} />
              )}
              {activeSection === "story" && (
                <LoveStoryForm
                  eventId={eventId}
                  type={type}
                  value={loveStory}
                  onChange={setLoveStory}
                  onStatusChange={reportStatus}
                />
              )}
              {activeSection === "gallery" && (
                <GalleryForm eventId={eventId} value={gallery} onChange={setGallery} />
              )}
              {activeSection === "sections" && (
                <SectionsForm
                  eventId={eventId}
                  type={type}
                  value={sectionOverrides}
                  onSaved={setSectionOverrides}
                  order={sectionOrder}
                  onOrderSaved={setSectionOrder}
                />
              )}
              {activeSection === "theme" && (
                <ThemeForm
                  eventId={eventId}
                  templateKey={templateKey}
                  value={theme}
                  onSaved={setTheme}
                  onStatusChange={reportStatus}
                />
              )}
              {activeSection === "template" && (
                <TemplateForm
                  eventId={eventId}
                  templates={templates}
                  previews={templatePreviews}
                  value={templateKey}
                  onSaved={setTemplateKey}
                />
              )}
            </div>
          </main>
        </div>

        <aside
          aria-label="Pratinjau undangan"
          className={`${previewOpenOnMobile ? "flex" : "hidden"} bg-background lg:border-border/60 lg:bg-muted/30 fixed inset-0 z-50 flex-col lg:sticky lg:top-6 lg:z-auto lg:flex lg:h-[calc(100dvh-3rem)] lg:w-[380px] lg:shrink-0 lg:self-start lg:rounded-br-3xl lg:border-l xl:w-[420px]`}
        >
          <EditorPreview
            invitation={previewInvitation}
            onClose={() => setPreviewOpenOnMobile(false)}
          />
        </aside>
      </div>
    </div>
  );
}
