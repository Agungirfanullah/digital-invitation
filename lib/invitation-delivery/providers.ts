import {
  DeliveryChannelNotConfiguredError,
  mapDeliveryErrorMessage,
} from "@/lib/invitation-delivery/errors";
import type {
  DeliveryChannel,
  DeliveryRequest,
  DeliveryResult,
} from "@/lib/invitation-delivery/types";

/** Interface a future real provider (WhatsApp Business API, an email provider, etc.) implements — guest/invitation business logic never needs to change to add one. */
export interface InvitationDeliveryProvider {
  channel: DeliveryChannel;
  send(request: DeliveryRequest): Promise<DeliveryResult>;
}

/**
 * No real provider is registered for any channel — there are no
 * WhatsApp Business API or email provider credentials configured in this
 * environment, and this phase explicitly must not fake or simulate a
 * successful send. `attemptDelivery()` below is fully wired end-to-end
 * against this registry; it just always reports "not configured" today,
 * honestly, instead of lying about a real send.
 */
const PROVIDERS: Partial<Record<DeliveryChannel, InvitationDeliveryProvider>> = {};

export function getDeliveryProvider(channel: DeliveryChannel): InvitationDeliveryProvider | null {
  return PROVIDERS[channel] ?? null;
}

/**
 * Attempts a real provider-mediated delivery. Never throws — always
 * resolves to a `DeliveryResult`, so a caller doesn't need its own
 * try/catch to handle "not configured" vs. a provider error. Not called
 * from any UI in this phase (there is nothing to send with yet); it
 * exists so the abstraction is genuinely exercised and testable now,
 * ready for a future provider to register itself.
 */
export async function attemptDelivery(request: DeliveryRequest): Promise<DeliveryResult> {
  const provider = getDeliveryProvider(request.channel);
  if (!provider) {
    return {
      ok: false,
      error: mapDeliveryErrorMessage(new DeliveryChannelNotConfiguredError(request.channel)),
    };
  }

  try {
    return await provider.send(request);
  } catch (error) {
    return { ok: false, error: mapDeliveryErrorMessage(error) };
  }
}
