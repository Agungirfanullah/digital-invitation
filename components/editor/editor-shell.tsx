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

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/events/${eventId}`}>&larr; Kembali</Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{initialEvent.title}</p>
            <p className="text-muted-foreground text-xs">
              {EVENT_STATUS_LABELS[initialEvent.status]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SaveStatusIndicator status={headerStatus} error={headerError} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setPreviewOpenOnMobile((open) => !open)}
          >
            {previewOpenOnMobile ? "Tutup Pratinjau" : "Pratinjau"}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <EditorSidebar type={type} active={activeSection} onChange={changeSection} />

        <main className="flex-1 border-t p-4 lg:border-t-0 lg:border-r lg:p-6">
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
        </main>

        <aside
          className={`${previewOpenOnMobile ? "block" : "hidden"} bg-background fixed inset-0 top-[57px] z-10 lg:static lg:top-auto lg:block lg:w-96`}
        >
          <EditorPreview invitation={previewInvitation} />
        </aside>
      </div>
    </div>
  );
}
