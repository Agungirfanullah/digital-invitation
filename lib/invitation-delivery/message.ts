import type { ComposedInvitationMessage } from "@/lib/invitation-delivery/types";

/**
 * The exact copy structure from `docs/PRD.md` §32, personalized with the
 * real guest name, event title, and invitation URL. Pure and
 * framework-agnostic — this composes a message for **preview/copy only**.
 * Nothing about calling this function records a delivery; see
 * `docs/DECISIONS.md` on why "composed" and "sent" are kept strictly
 * separate concepts in this domain.
 */
export function composeInvitationMessage(input: {
  guestName: string;
  eventTitle: string;
  invitationUrl: string;
}): ComposedInvitationMessage {
  const text = [
    `Halo ${input.guestName},`,
    "",
    `Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir di ${input.eventTitle}.`,
    "",
    "Silakan membuka undangan melalui tautan berikut:",
    input.invitationUrl,
    "",
    "Terima kasih atas doa dan kehadirannya.",
  ].join("\n");

  return { text, url: input.invitationUrl };
}
