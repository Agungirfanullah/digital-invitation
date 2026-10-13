import { GENERIC_OG_CARD } from "@/lib/invitations/og-card";
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createOgImageResponse,
} from "@/lib/invitations/og-image";

export const alt = "Digital Invitation — undangan digital yang cantik dan personal";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

/** Site-wide default preview (homepage and any route without its own image). Static: no data, no request APIs. */
export default function Image() {
  return createOgImageResponse(
    {
      ...GENERIC_OG_CARD,
      typeLabel: "Undangan Digital",
      heading: "Buat undangan digital yang cantik dan personal",
      headingFontSize: 64,
    },
    { cacheable: true },
  );
}
