import { InvitationNotFoundError } from "@/lib/invitations/errors";
import { GENERIC_OG_CARD, buildOgCard } from "@/lib/invitations/og-card";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createOgImageResponse,
} from "@/lib/invitations/og-image";
import { withLoadedPhoto } from "@/lib/invitations/og-photo";
import { getPublicInvitationBySlug } from "@/lib/invitations/service";
import { derivePathFromPublicUrl } from "@/lib/storage/paths";

export const alt = "Undangan digital";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

// Reads the database on every request: the card must follow publish/unpublish
// and edits, so it is never prerendered or cached by Next itself (the
// response's own short s-maxage is the only cache).
export const dynamic = "force-dynamic";

/**
 * Link-preview image for a public invitation. Deliberately ignores `?to=`:
 * previews are fetched and cached by crawlers, so they must never contain
 * guest-specific data. A missing, malformed or unpublished slug gets the
 * same generic card as any other unknown slug, so this route reveals
 * nothing the (equally public) page would not.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const invitation = await getPublicInvitationBySlug(slug);
    const card = buildOgCard(invitation, {
      // Only our own Supabase Storage URLs are fetched server-side; an
      // owner-pasted URL could otherwise point the renderer at an internal host.
      isTrustedPhotoUrl: (url) => derivePathFromPublicUrl(url) !== null,
    });
    return createOgImageResponse(await withLoadedPhoto(card), { cacheable: true });
  } catch (error) {
    if (error instanceof InvitationNotFoundError) {
      return createOgImageResponse(GENERIC_OG_CARD, { cacheable: true });
    }
    console.error("[og] failed to render invitation preview", error);
    return createOgImageResponse(GENERIC_OG_CARD, { cacheable: false });
  }
}
