"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { EditorEventData, EditorTemplateOption } from "@/lib/editor/types";
import { buildPreviewInvitation } from "@/lib/editor/preview";
import { EVENT_STATUS_LABELS } from "@/lib/events/labels";
import { Button } from "@/components/ui/button";
import { EditorSidebar, type EditorSectionKey } from "@/components/editor/editor-sidebar";
import { EditorPreview } from "@/components/editor/editor-preview";
import { SaveStatusIndicator } from "@/components/editor/save-status";
import type { SaveStatus } from "@/components/editor/use-autosave";
import { CoupleForm } from "@/components/editor/sections/couple-form";
import { ThemeForm } from "@/components/editor/sections/theme-form";
import { TemplateForm } from "@/components/editor/sections/template-form";
import { ScheduleForm } from "@/components/editor/sections/schedule-form";
import { LoveStoryForm } from "@/components/editor/sections/love-story-form";
import { GalleryForm } from "@/components/editor/sections/gallery-form";

export function EditorShell({
  initialEvent,
  templates,
}: {
  initialEvent: EditorEventData;
  templates: EditorTemplateOption[];
}) {
  const { eventId } = initialEvent;

  const [activeSection, setActiveSection] = useState<EditorSectionKey>("couple");
  const [weddingProfile, setWeddingProfile] = useState(initialEvent.weddingProfile);
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
        weddingProfile,
        theme,
        schedules,
        loveStory,
        gallery,
      }),
    [initialEvent, templateKey, weddingProfile, theme, schedules, loveStory, gallery],
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
        <EditorSidebar active={activeSection} onChange={changeSection} />

        <main className="flex-1 border-t p-4 lg:border-t-0 lg:border-r lg:p-6">
          {activeSection === "couple" && (
            <CoupleForm
              eventId={eventId}
              value={weddingProfile}
              onSaved={setWeddingProfile}
              onStatusChange={reportStatus}
            />
          )}
          {activeSection === "schedule" && (
            <ScheduleForm eventId={eventId} items={schedules} onChange={setSchedules} />
          )}
          {activeSection === "loveStory" && (
            <LoveStoryForm
              eventId={eventId}
              value={loveStory}
              onChange={setLoveStory}
              onStatusChange={reportStatus}
            />
          )}
          {activeSection === "gallery" && (
            <GalleryForm eventId={eventId} value={gallery} onChange={setGallery} />
          )}
          {activeSection === "theme" && (
            <ThemeForm
              eventId={eventId}
              value={theme}
              onSaved={setTheme}
              onStatusChange={reportStatus}
            />
          )}
          {activeSection === "template" && (
            <TemplateForm
              eventId={eventId}
              templates={templates}
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
