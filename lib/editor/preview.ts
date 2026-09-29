import type { EventType } from "@prisma/client";

import { buildPublicIdentity, type IdentityProfileData } from "@/lib/event-types/identity";
import { resolveEnabledSections, type SectionOverrides } from "@/lib/event-types/sections";
import { parseTheme } from "@/lib/invitations/theme";
import type { PublicInvitation } from "@/lib/invitations/types";
import { stripDisabledSectionContent } from "@/lib/invitations/visibility";
import type {
  EditorGallery,
  EditorLoveStory,
  EditorSchedule,
  EditorTheme,
} from "@/lib/editor/types";

export interface PreviewSource {
  eventId: string;
  slug: string;
  type: EventType;
  title: string;
  description: string | null;
  templateKey: string | null;
  identity: IdentityProfileData;
  sectionOverrides: SectionOverrides;
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
 * rendering. Identity goes through the same `buildPublicIdentity()`, and
 * section configuration through the same `resolveEnabledSections()` +
 * `stripDisabledSectionContent()`, as the public projection
 * (lib/invitations/projection.ts), so preview and public can't diverge.
 * `EditorSchedule`/etc. are structural supersets of their `Public*`
 * counterparts (entity ids included, for the editor's own use), so they
 * pass through unchanged; only the theme needs `parseTheme()`'s
 * default-fallback treatment, same as production.
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
  return stripDisabledSectionContent({
    eventId: source.eventId,
    slug: source.slug,
    type: source.type,
    title: source.title,
    description: source.description,
    templateKey: source.templateKey,
    theme: parseTheme(source.theme),
    identity: buildPublicIdentity(source.type, source.identity),
    sections: resolveEnabledSections(source.type, { sections: source.sectionOverrides }),
    schedules: source.schedules,
    loveStory: source.loveStory,
    galleries: source.gallery ? [source.gallery] : [],
    giftMethods: [],
    wishes: [],
    guest: null,
  });
}
