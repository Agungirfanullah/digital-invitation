/**
 * Provider-agnostic invitation delivery abstraction. No real
 * WhatsApp/email provider is configured or implemented yet (see
 * `providers.ts`) — these types exist so a future provider can implement
 * `InvitationDeliveryProvider` without any guest/invitation business
 * logic changing.
 */

export type DeliveryChannel = "WHATSAPP" | "EMAIL";

export interface DeliveryRecipient {
  name: string;
  phone: string | null;
  email: string | null;
}

/** A composed, ready-to-send/copy invitation message. Never recorded as "sent" merely by existing — composing or copying is not delivering. */
export interface ComposedInvitationMessage {
  text: string;
  url: string;
}

export interface DeliveryRequest {
  channel: DeliveryChannel;
  recipient: DeliveryRecipient;
  message: ComposedInvitationMessage;
}

export type DeliveryResult = { ok: true; providerMessageId: string } | { ok: false; error: string };
