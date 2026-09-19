import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getEditorEvent, listTemplateOptions } from "@/lib/editor/service";
import { EventNotFoundError } from "@/lib/editor/errors";
import { EditorShell } from "@/components/editor/editor-shell";

export const metadata: Metadata = {
  title: "Editor Undangan — Digital Invitation",
};

interface EditorPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { eventId } = await params;
  const user = await requireAppUser();

  let editorEvent;
  try {
    editorEvent = await getEditorEvent(eventId, user.id);
  } catch (error) {
    if (error instanceof EventNotFoundError) notFound();
    throw error;
  }

  const templates = await listTemplateOptions();

  return <EditorShell initialEvent={editorEvent} templates={templates} />;
}
