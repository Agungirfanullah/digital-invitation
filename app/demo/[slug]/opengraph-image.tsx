import { GENERIC_OG_CARD, buildOgCard } from "@/lib/invitations/og-card";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createOgImageResponse,
} from "@/lib/invitations/og-image";
import { isKnownTemplateKey } from "@/lib/invitations/templates/registry";
import { buildDemoInvitation, templateDisplayName } from "@/lib/marketing/demo-invitation";

export const alt = "Demo template undangan digital";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

/**
 * Link-preview image for a template demo page, drawn in that template's own
 * default palette so each shared demo link looks like its template. Pure
 * fabricated demo data and no photo, so there is nothing private or external
 * to guard here; an unknown slug gets the generic card.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isKnownTemplateKey(slug)) {
    return createOgImageResponse(GENERIC_OG_CARD, { cacheable: true });
  }

  const card = buildOgCard(buildDemoInvitation(slug), {
    isTrustedPhotoUrl: () => false,
    footer: `Demo template ${templateDisplayName(slug)}`,
  });
  return createOgImageResponse(card, { cacheable: true });
}
