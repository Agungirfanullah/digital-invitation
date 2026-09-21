import type { EventType } from "@prisma/client";

import { parseTheme } from "@/lib/invitations/theme";
import type { PublicInvitation } from "@/lib/invitations/types";
import type {
  EditorGallery,
  EditorLoveStory,
  EditorSchedule,
  EditorTheme,
  EditorWeddingProfile,
} from "@/lib/editor/types";

export interface PreviewSource {
  eventId: string;
  slug: string;
  type: EventType;
  title: string;
  description: string | null;
  templateKey: string | null;
  weddingProfile: EditorWeddingProfile | null;
  theme: EditorTheme | null;
  schedules: EditorSchedule[];
  loveStory: EditorLoveStory | null;
  gallery: EditorGallery | null;
}

/**
 * Builds a `PublicInvitation` directly from current (possibly unsaved)
 * editor state, so the preview panel renders through the exact same
 * `InvitationRenderer` → template → sections pipeline the public
 * `/invite/[slug]` route uses — no separate/duplicated preview
 * rendering. `EditorSchedule`/`EditorWeddingProfile`/etc. are structural
 * supersets of their `Public*` counterparts (entity ids included, for
 * the editor's own use), so they pass through unchanged; only the theme
 * needs `parseTheme()`'s default-fallback treatment, same as production.
 *
 * Gift methods and wishes are intentionally not part of `PreviewSource` —
 * both are managed on their own dedicated dashboard pages
 * (`/dashboard/events/[eventId]/gifts`, `/wishes`), not the editor, so
 * there's no unsaved/in-progress state for this preview to reflect (see
 * docs/DECISIONS.md D-034, D-039). `giftMethods`/`wishes` are always empty
 * here; the real published invitation still renders whatever is actually
 * configured/approved.
 */
export function buildPreviewInvitation(source: PreviewSource): PublicInvitation {
  return {
    eventId: source.eventId,
    slug: source.slug,
    type: source.type,
    title: source.title,
    description: source.description,
    templateKey: source.templateKey,
    theme: parseTheme(source.theme),
    weddingProfile: source.weddingProfile,
    schedules: source.schedules,
    loveStory: source.loveStory,
    galleries: source.gallery ? [source.gallery] : [],
    giftMethods: [],
    wishes: [],
    guest: null,
  };
}
