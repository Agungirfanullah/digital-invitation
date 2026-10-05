import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAppUser } from "@/lib/auth/session";
import { getEditorEvent, listTemplateOptions } from "@/lib/editor/service";
import { EventNotFoundError } from "@/lib/editor/errors";
import { buildDemoInvitation } from "@/lib/marketing/demo-invitation";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
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

  // Rendered here because buildDemoInvitation() is server-only. Only the
  // Template tab ever mounts these, so the cost is the payload, not extra
  // client work on every editor visit.
  const templatePreviews = Object.fromEntries(
    templates
      .filter((template) => template.implemented)
      .map((template) => [
        template.slug,
        <InvitationRenderer
          key={template.slug}
          invitation={buildDemoInvitation(template.slug)}
          bypassOpening
        />,
      ]),
  );

  return (
    <EditorShell
      initialEvent={editorEvent}
      templates={templates}
      templatePreviews={templatePreviews}
    />
  );
}
